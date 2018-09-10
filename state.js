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

//Active types
const GOOD = "good";
const BAD = "bad";
const NEUTRAL = "neutral";

//Equip types
const HEAD = "head";
const ARMOR = "armor";
const BOTTOM = "bottom";
const WEAPON = "weapon";

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

//Character functions, not to be confused with the active character functions, characterfunc
let charfunc = require('./character/character.js');
let classfunc = require('./character/class.js');

//EXPORTS
exports.IMMEDIATE = IMMEDIATE;
exports.CONSUME = CONSUME;
exports.NONCONSUME = NONCONSUME;
exports.TOGGLE = TOGGLE;
exports.INDEFINITE = INDEFINITE;

exports.GOOD = GOOD;
exports.BAD = BAD;
exports.NEUTRAL = NEUTRAL;

exports.PREBATTLE = PREBATTLE;
exports.PRERESULTS = PRERESULTS;
exports.POSTRESULTS = POSTRESULTS;

///////////
// ITEMS //
///////////
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

			dbfunc.pushToState(character, eventId, event, event.battleStates, amount);
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

			dbfunc.spliceFromState(character, eventId, event, event.battleStates, active);
			message.channel.send(message.member.displayName + " has deactivated " + event.name);
		}
		//Activate
		else{

			dbfunc.pushToState(character, eventId, event, event.battleStates, null);
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

			dbfunc.pushToState(character, eventId, event, event.battleStates, amount);
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

///////////
// EQUIP //
///////////
/**
* Equip. Set type to equipId. Recalculate stats.
*/
exports.equip = function(message, character, equip){

	character.powEq += equip.pow;
	character.wisEq += equip.wis;
	character.defEq += equip.def;
	character.resEq += equip.res;
	character.spdEq += equip.spd;
	character.lukEq += equip.luk;

	if(equip.active != null){

		var active = activesList[equip.active];
		active._id = character._id + equip.active;
	  active.character = character._id;
		dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
	}

	character[equip.type] = equip.id;

	charfunc.calculateStats(character);

	message.channel.send(message.member.displayName + " equipped " + equip.name + "!");
}

/**
* Unequip. Set type to empty string. Recalculate stats.
*/
exports.unequip = function(message, character, equip){

	character.powEq -= equip.pow;
	character.wisEq -= equip.wis;
	character.defEq -= equip.def;
	character.resEq -= equip.res;
	character.spdEq -= equip.spd;
	character.lukEq -= equip.luk;

	if(equip.active != null){

		var active = activesList[equip.active];
		active._id = character._id + equip.active;
	  active.character = character._id;
		dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
	}

	character[equip.type] = "";

	charfunc.calculateStats(character);

	message.channel.send(message.member.displayName + " unequipped " + equip.name + "!");
}

//////////////////
// BATTLE STATE //
//////////////////
/**
* Pre battle calculations.
*/
exports.prebattle = function(message, args, character, battleState, actives, grumbo){

	battleState.levelDiffActual = character.level - args[3];

	//Prebattle base/modifiers
	battleState.preMessages = [];
	battleState.chanceMod = 0;
	battleState.levelDiffMod = 0;
	battleState.minMod = 0;
	battleState.maxMod = 0;
	battleState.hpMod = 0;
	battleState.powMod = 0;
	battleState.wisMod = 0;

	battlefunc.calculateCharacterMods(message, args, character, battleState, actives, grumbo);

	//Prebattle Grumbo effects
	for(var i = grumbo.prebattle.length - 1; i >= 0; i--){

		var eventId = grumbo.prebattle[i];
		var eventActive = activesList[eventId];
		if(grumbofunc.prebattle[eventId] != null){

			var random = Math.random() * 100;
			if(random < character.res && eventActive.effect == exports.BAD){

				battleState.preMessages.push(charfunc.resistMessage(eventActive.name));
			}
			else{

				grumbofunc.prebattle[eventId](character, battleState, eventId, actives);
			}
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
	battleState.chance = 50 + (battleState.levelDiff * 2) + Math.floor(Math.random() * 4) - 2 + battleState.chanceMod + battleState.powMod + battleState.wisMod + battleState.hpMod;
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
* Pre results calculations.
*/
exports.preresults = function(message, character, battleState, actives, grumbo){

	//Preresults base/modifiers
	battleState.preResMessages = [];
	battleState.expMod = 0;
	battleState.win = false;
	if(battleState.result < battleState.chance){

		battleState.win = true;
	}

	//Preresults Grumbo effects
	for(var i = grumbo.preresults.length - 1; i >= 0; i--){

		var eventId = grumbo.preresults[i];
		var eventActive = activesList[eventId];
		if(grumbofunc.preresults[eventId] != null){

			var random = Math.random() * 100;
			if(random < character.res && eventActive.effect == exports.BAD){

				battleState.preResMessages.push(charfunc.resistMessage(eventActive.name));
			}
			else{

				grumbofunc.preresults[eventId](character, battleState, eventId, actives);
			}
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

		battleState.exp = battlefunc.calculateBattleExp(character, battleState.levelDiff, battleState);
		battleState.gold = Math.ceil(battlefunc.calculateBattleGold(character, battleState.levelDiff) * (1 + (character.luk / 100)));
	}
}

/**
* Post results calculations.
*/
exports.postresults = function(message, character, battleState, actives, grumbo){

	//Postresults base/modifiers
	battleState.endMessages = [];
	battleState.avoidPostResults = false;
	battleState.hpLoss = 3;
	battleState.classExp = 1;

	battlefunc.calculateHPLoss(message, character, battleState, actives, grumbo);

	//Postresults character active functions
	for(var i = character.postresults.length - 1; i >= 0; i--){

		var eventId = character.postresults[i];
		if(characterfunc.postresults[eventId] != null){

			characterfunc.postresults[eventId](character, battleState, eventId, actives);
		}
	};

	//Postresults Grumbo effects
	for(var i = grumbo.postresults.length - 1; i >= 0; i--){

		var eventId = grumbo.postresults[i];
		var eventActive = activesList[eventId];
		if(grumbofunc.postresults[eventId] != null && !battleState.avoidPostResults){

			var random = Math.random() * 100;
			if(random < character.res && eventActive.effect == exports.BAD){

				battleState.endMessages.push(charfunc.resistMessage(eventActive.name));
			}
			else{

				grumbofunc.postresults[eventId](character, battleState, eventId, actives);
			}
		}
	};

	//Calculate postresults variables
	if(battleState.win){

		var leftover = (battleState.exp + character.experience) % 100;
		battleState.gains = Math.floor(((battleState.exp + character.experience)/100));

		//Win message and results
		character.battlesLeft -= 1;
		character.wins += 1;
		charfunc.levelChange(character, battleState.gains);
		character.experience = leftover;
		character.gold = Math.floor(character.gold + battleState.gold);
		character.winrate = Math.floor(((character.wins / (character.wins + character.losses)) * 100));
	}
	else{

		character.battlesLeft -= 1;
		character.losses += 1;
		character.winrate = Math.floor(((character.wins / (character.wins + character.losses)) * 100));
	}

	character.hp -= battleState.hpLoss;
	if(character.hp < 0) character.hp = 0;
	else if(character.hp > charfunc.MAX_HP) character.hp = charfunc.MAX_HP;
	character.classExp += battleState.classExp;
	classfunc.levelUpClass(character, battleState);
}
