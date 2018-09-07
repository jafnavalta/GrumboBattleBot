//Initialize DB
let dbfunc = require('./data/db.js');

//Initialize items
const fs = require("fs");
let itemList = JSON.parse(fs.readFileSync("./values/items.json", "utf8"));
let activesList = JSON.parse(fs.readFileSync("./values/actives.json", "utf8"));


//CONSTANTS
//Item types
const IMMEDIATE = "immediate"; //Consume with no active state, no duration
const CONSUME = "consume"; //Consume with active state, has duration
const NONCONSUME = "nonconsume"; //Don't consume with no active state, could have duration
const TOGGLE = "toggle"; //Don't consume with active state. Stays active until used again
const INDEFINITE = "indefinite"; //Consume with active state, no duration

//Battle states
const PREBATTLE = "prebattle"; //Before battle begins
const PRERESULTS = "preresults"; //After battle ends but before results are calculated
const POSTRESULTS = "postresults"; //After results are calculated

//Battle functions
let battlefunc = require('./command/battle.js');

//Active functions
let characterfunc = require('./actives/active_character.js');
let grumbofunc = require('./actives/active_grumbo.js');
let usefunc = require('./actives/active_use.js');

//EXPORTS
exports.IMMEDIATE = IMMEDIATE;
exports.CONSUME = CONSUME;
exports.NONCONSUME = NONCONSUME;
exports.TOGGLE = TOGGLE;
exports.INDEFINITE = INDEFINITE;

exports.PREBATTLE = PREBATTLE;
exports.PRERESULTS = PRERESULTS;
exports.POSTRESULTS = POSTRESULTS;

/**
* Do a particular function based on the eventId (item, equip, effect, skill, etc.) and consume eventId
*/
exports.immediate = function(message, character, eventId, event, amount){

	var state = {
		
		result: message.member.displayName + " has used " + event.name + " x" + amount
	}
	usefunc.immediate[eventId](message, character, state, eventId, event, amount);
	
	message.channel.send(state.result);
	
	//Save character
	dbfunc.updateCharacter(character);
}

/**
* Add consumed eventId to active list.
*/
exports.consume = function(message, character, eventId, event, amount){
	
	var result = message.member.displayName + " has used " + event.name + " x" + amount;
	
	dbfunc.getDB().collection("actives").findOne({"_id": character._id + eventId, "character": character._id, "id": eventId}, function(err, active){
		
		var wasConsumed = true;
		if(active == null){
			
			exports.pushToState(character, eventId, event, event.battleStates, amount);
		}
		else{
			
			//Extend duration of consumable
			//If duration is 0, don't allow use of item. Duration will be 0 if null.
			if(active.duration == 10 || active.duration + (event.duration * amount) > 10){
				
				result = "You can't have an active for longer than 10 battles";
				wasConsumed = false;
			}
			else{
				
				active.duration += event.duration * amount;
				dbfunc.updateActive(active);
			}
		}
		if(wasConsumed){
			
			for(var i = 0; i < amount; i++){
				
				var index = character.items.indexOf(eventId);
				character.items.splice(index, 1);
			}
		}
		
		message.channel.send(result);
		
		//Save character
		dbfunc.updateCharacter(character);
	});
}

/**
* Do a particular function based on the eventId (item, equip, effect, skill, etc.) without consuming eventId
*/
exports.nonconsume = function(message, character, eventId, event, amount){

	//None right now
}

/**
* Activate or deactivate the eventId.
*/
exports.toggle = function(message, character, eventId, event, amount){

	dbfunc.getDB().collection("actives").findOne({"_id": character._id + eventId, "character": character._id, "id": eventId}, function(err, active){

		//Deactivate
		if(active != null){
			
			exports.spliceFromState(character, eventId, event, event.battleStates, active);
			message.channel.send(message.member.displayName + " has deactivated " + event.name);
		}
		//Activate
		else{
			
			exports.pushToState(character, eventId, event, event.battleStates, null);
			message.channel.send(message.member.displayName + " has activated " + event.name);
		}
		
		//Save character
		dbfunc.updateCharacter(character);
	});
}

/**
* Add indefinite eventId to active list.
*/
exports.indefinite = function(message, character, eventId, event, amount){
	
	var result = message.member.displayName + " has used " + event.name;
	
	dbfunc.getDB().collection("actives").findOne({"_id": character._id + eventId, "character": character._id, "id": eventId}, function(err, active){
		
		var wasConsumed = true;
		if(active == null){
			
			exports.pushToState(character, eventId, event, event.battleStates, amount);
		}
		else{
			
			result = message.member.displayName + " already has " + event.name + " active!";
			wasConsumed = false;
		}
		if(wasConsumed){
				
			var index = character.items.indexOf(eventId);
			character.items.splice(index, 1);
		}
		
		message.channel.send(result);
		
		//Save character
		dbfunc.updateCharacter(character);
	});
}

/**
* Pre battle calculations.
*/
exports.prebattle = function(message, args, character, battleState, actives, grumbo){
	
	battleState.levelDiffActual = character.level - args[3];
	
	//Prebattle base/modifiers
	battleState.chanceMod = 0;
	battleState.levelDiffMod = 0;
	battleState.minMod = 0;
	battleState.maxMod = 0;
	
	//Prebattle Grumbo effects
	for(var i = grumbo.prebattle.length - 1; i >= 0; i--){
		
		var eventId = grumbo.prebattle[i];
		if(grumbofunc.prebattle[eventId] != null){
			
			grumbofunc.prebattle[eventId](character, battleState, eventId, actives);
		}
	};
	
	//Prebattle character active functions
	for(var i = character.prebattle.length - 1; i >= 0; i--){
		
		var eventId = character.prebattle[i];
		if(characterfunc.prebattle[eventId] != null){
			
			characterfunc.prebattle[eventId](character, battleState, eventId, actives);
		}
	};
	
	//Calculate prebattle variables
	battleState.levelDiff = character.level - args[3] + battleState.levelDiffMod;
	battleState.chance = 50 + (battleState.levelDiff * 2) + Math.floor(Math.random() * 6) - 3 + battleState.chanceMod;
	var max = 95 + battleState.maxMod;
	var min = 5 + battleState.minMod;
	if(battleState.levelDiff < -15){
		
		battleState.chance -= (Math.floor(Math.random() * 3) + 1);
	}
	if(battleState.chance > max){
		
		battleState.chance = max;
	}
	else if(battleState.chance < min){
		
		battleState.chance = min;
	}
}

/**
* Pre results calculations. //TODO
*/
exports.preresults = function(message, character, battleState, actives, grumbo){
		
	//Preresults base/modifiers
	//None right now
	
	//Preresults Grumbo effects
	for(var i = grumbo.preresults.length - 1; i >= 0; i--){
		
		var eventId = grumbo.preresults[i];
		if(grumbofunc.preresults[eventId] != null){
			
			grumbofunc.preresults[eventId](character, battleState, eventId, actives);
		}
	};
	
	//Preresults character active functions
	for(var i = character.preresults.length - 1; i >= 0; i--){
		
		var eventId = character.preresults[i];
		if(characterfunc.preresults[eventId] != null){
			
			characterfunc.preresults[eventId](character, battleState, eventId, actives);
		}
	};
	
	//Calculate preresults variables
	if(battleState.win){
		
		battleState.exp = battlefunc.calculateBattleExp(character, battleState.levelDiff);
		battleState.gold = battlefunc.calculateBattleGold(character, battleState.levelDiff);
	}
}

/**
* Post results calculations. //TODO
*/
exports.postresults = function(message, character, battleState, actives, grumbo){
		
	//Postresults base/modifiers
	battleState.endMessages = [];
	battleState.avoidPostResults = false;
	
	//Postresults character active functions
	for(var i = character.postresults.length - 1; i >= 0; i--){
		
		var eventId = character.postresults[i];
		if(characterfunc.postresults[eventId] != null){
			
			characterfunc.postresults[eventId](character, battleState, eventId, actives);
		}
	};
	
	if(!battleState.avoidPostResults){
	
		//Postresults Grumbo effects
		for(var i = grumbo.postresults.length - 1; i >= 0; i--){
			
			var eventId = grumbo.postresults[i];
			if(grumbofunc.postresults[eventId] != null){
				
				grumbofunc.postresults[eventId](character, battleState, eventId, actives);
			}	
		};
	}
	else{
		
		battleState.endMessages.push("You avoided post battle effects!");
	}
	
	//Calculate postresults variables
	if(battleState.win){
		
		var leftover = (battleState.exp + character.experience) % 100;
		battleState.gains = Math.floor(((battleState.exp + character.experience)/100));
		var newLevel = character.level + battleState.gains;
		
		//Win message and results
		character.battlesLeft -= 1;
		character.wins += 1;
		character.level = newLevel;
		character.experience = leftover;
		character.gold += battleState.gold;
		character.winrate = Math.floor(((character.wins / (character.wins + character.losses)) * 100));
	}
	else{
		
		character.battlesLeft -= 1;
		character.losses += 1;
		character.winrate = Math.floor(((character.wins / (character.wins + character.losses)) * 100));
	}
}

/**
* Push to character state active.
*/
exports.pushToState = function(character, eventId, event, eventStates, amount){
	
	var totalDuration = event.duration;
	if(amount != null){
		
		//If totalDuration is null, this will make it 0
		totalDuration = totalDuration * amount;
	}
	var id = character._id + eventId;
	var newActive = {
		
		_id: id,
		character: character._id,
		id: eventId,
		battleStates: event.battleStates,
		name: event.name,
		duration: totalDuration
	}
	
	eventStates.forEach(function(eventState){
		
		character[eventState].push(eventId);
	});
	
	dbfunc.updateActive(newActive);
}

/**
* Splice from character state active.
*/
exports.spliceFromState = function(character, eventId, event, eventStates, active){

	eventStates.forEach(function(eventState){

		var index = character[eventState].indexOf(eventId);
		character[eventState].splice(index, 1);
	});
	
	dbfunc.removeActive(active);
}

/**
* Reduce the duration of an active and its states.
*/
exports.reduceDuration = function(character, characterStates, eventId, actives){
	
	var active;
	for(var i = 0; i < actives.length; i++){
		
		if(actives[i].id == eventId){
			
			active = actives[i];
			break;
		}
	}
	if(active.duration <= 1){
	
		for(var i = 0; i < characterStates.length; i++){
			
			var characterState = characterStates[i];
			var index = characterState.indexOf(eventId);
			characterState.splice(index, 1);
			dbfunc.removeActive(active);
		}
	}
	else{
		
		active.duration -= 1;
		dbfunc.updateActive(active);
	}
}
