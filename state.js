//Initialize items
const fs = require("fs");
let itemList = JSON.parse(fs.readFileSync("./values/items.json", "utf8"));

//CONSTANTS
//Item types
const IMMEDIATE = "immediate"; //Consume with no active state
const CONSUME = "consume"; //Consume with active state
const NONCONSUME = "non-consume"; //Don't consume with no active state
const TOGGLE = "toggle"; //Don't consume with active state. Stays active until used again

//Battle states
const PREBATTLE = "pre-battle"; //Before battle begins
const PRERESULTS = "pre-results"; //After battle ends but before results are calculated
const POSTRESULTS = "post-results"; //After results are calculated

//EXPORTS
exports.IMMEDIATE = IMMEDIATE;
exports.CONSUME = CONSUME;
exports.NONCONSUME = NONCONSUME;
exports.TOGGLE = TOGGLE;

exports.PREBATTLE = PREBATTLE;
exports.PRERESULTS = PRERESULTS;
exports.POSTRESULTS = POSTRESULTS;

/**
* Do a particular function based on the event (item, equip, effect, skill, etc.) and consume event
*/
exports.immediate = function(levels, message, character, event, eventName){

	var resultString = message.member.displayName + " has used " + eventName;

	switch(event){
	
		case 'battle_ticket':
		
			if(character.battlesLeft < 3){
				
				var index = character.items.indexOf(event);
				character.items.splice(index, 1);
				character.battletime -= 3600000;
			}
			else{
				
				resultString = "You already have all battle attempts available.";
			}
			break;
			
		case 'challenge_ticket':
		
			if(character.challengesLeft < 3){
				
				var index = character.items.indexOf(event);
				character.items.splice(index, 1);
				character.challengetime -= 3600000;
			}
			else{
				
				resultString = "You already have all challenge attempts available.";
			}
			break;
			
		default:
			//Do nothing
			break;
	}
	
	message.channel.send(resultString);
	
	//Save character
	fs.writeFile("./levels.json", JSON.stringify(levels, null, 4), (err) => {
		
		if (err) console.error(err)
	});
}

/**
* Add consumed event to active list.
*/
exports.consume = function(levels, message, character, event, eventName, eventState){

	var resultString = message.member.displayName + " has used " + eventName;
	
	if(!character.active.includes(event)){
		
		pushToState(character, event, eventState);
		var index = character.items.indexOf(event);
		character.items.splice(index, 1);
	}
	else{
		
		resultString = "You already have " + eventName + " active.";
	}
	
	message.channel.send(resultString);
	
	//Save character
	fs.writeFile("./levels.json", JSON.stringify(levels, null, 4), (err) => {
		
		if (err) console.error(err)
	});
}

/**
* Do a particular function based on the event (item, equip, effect, skill, etc.) without consuming event
*/
exports.nonconsume = function(levels, message, character, event, eventName){

	//TODO add more item/equip functions
}

/**
* Activate or deactivate the event.
*/
exports.toggle = function(levels, message, character, event, eventName, eventState){

	//Deactivate
	if(character.active.includes(event)){
		
		spliceFromState(character, event, eventState);
		message.channel.send(message.member.displayName + " has deactivated " + eventName);
	}
	//Activate
	else{
		
		pushToState(character, event, eventState);
		message.channel.send(message.member.displayName + " has activated " + eventName);
	}
	
	//Save character
	fs.writeFile("./levels.json", JSON.stringify(levels, null, 4), (err) => {
		
		if (err) console.error(err)
	});
}

/**
* Pre battle calculations.
*/
exports.prebattle = function(levels, message, args, character, battleState){
	
	battleState.levelDiffActual = character.level - args[3];
	
	//TODO prebattle modifiers
	var chanceMod = 0;
	var levelDiffMod = 0;
	
	//TODO prebattle active functions
	character.prebattle.forEach(function(event){
		
		switch(event){
			
			case 'battle_potion':
			
				if(battleState.levelDiffActual >= 0) chanceMod += 5;
				else if(battleState.levelDiffActual >= -5) chanceMod += 4;
				else if(battleState.levelDiffActual >= -10) chanceMod += 3;
				else if(battleState.levelDiffActual >= -15) chanceMod += 2;
				else chanceMod += 1;
				var activeIndex = character.active.indexOf(event);
				var preIndex = character.prebattle.indexOf(event);
				character.active.splice(activeIndex, 1);
				character.prebattle.splice(preIndex, 1);
				break;
			
			default:
				//Do nothing
				break;
		}
	});
	
	//Calculate prebattle variables
	battleState.levelDiff = character.level - args[3] + levelDiffMod;
	battleState.chance = 50 + (battleState.levelDiff * 2) + Math.floor(Math.random() * 6) - 3; + chanceMod;
	if(battleState.levelDiff < -15){
		
		battleState.chance -= (Math.floor(Math.random() * 6) + 1);
	}
	if(battleState.chance > 95){
		
		battleState.chance = 95;
	}
	else if(battleState.chance < 5){
		
		battleState.chance = 5;
	}
}

//TODO more battle state functions

/**
* Push to character state active.
*/
function pushToState(character, event, eventState){
	
	character.active.push(event);
	
	switch(eventState){
		
		case PREBATTLE:
		
			character.prebattle.push(event);
			break;
			
		case PRERESULTS:
		
			character.preresults.push(event);
			break;
			
		case POSTRESULTS:
		
			character.postresults.push(event);
			break;
			
		default:
			//Do nothing
			break;
	}
}

/**
* Splice from character state active.
*/
function spliceFromState(character, event, eventState){

	var index = character.active.indexOf(event);
	character.active.splice(index, 1);

	switch(eventState){
		
		case PREBATTLE:
		
			index = character.prebattle.indexOf(event);
			character.prebattle.splice(index, 1);
			break;
			
		case PRERESULTS:
		
			index = character.preresults.indexOf(event);
			character.preresults.splice(index, 1);
			break;
			
		case POSTRESULTS:
		
			index = character.postresults.indexOf(event);
			character.postresults.splice(index, 1);
			break;
			
		default:
			//Do nothing
			break;
	}
}
