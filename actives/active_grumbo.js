//Initialize DB functions
let dbfunc = require('../data/db.js');

//Initialize list of actives
const fs = require("fs");
let activesList = JSON.parse(fs.readFileSync("./values/actives.json", "utf8"));

//Initialize state for state constants and functions
let state = require('../state.js');

//Initialize states
exports.prebattle = {};
exports.preresults = {};
exports.postresults = {};

////////////////////////////////
// GRUMBO PREBATTLE FUNCTIONS //
////////////////////////////////
exports.prebattle.wumbo = function(character, battleState, eventId, actives){
	
	battleState.maxMod -= 25;
}

/////////////////////////////////
// GRUMBO PRERESULTS FUNCTIONS //
/////////////////////////////////

//////////////////////////////////
// GRUMBO POSTRESULTS FUNCTIONS //
//////////////////////////////////
exports.postresults.poison = function(character, battleState, eventId, actives){
	
	if(!battleState.win){
					
		var active;
		if(character.prebattle.includes(eventId)){
			for(var i = 0; i < actives.length; i++){
				
				if(actives[i].id == eventId){
					
					active = actives[i];
					active.duration += activesList[eventId].duration;
					if(active.duration > 10) active.duration = 10;
					dbfunc.updateActive(active);
					break;
				}
			}
		}
		else{
			
			active = activesList[eventId];
			state.pushToState(character, eventId, active, active.battleStates, 1);
		}
		battleState.endMessages.push("You have been poisoned!");
	}
}

exports.postresults.pilfer = function(character, battleState, eventId, actives){
	
	if(!battleState.win){
					
		if(character.postresults.includes('fools_gold')){
			
			state.reduceDuration(character, [character.preresults, character.postresults], 'fools_gold', actives);
			battleState.endMessages.push("Fools Gold was taken!");
		}
		else{
			
			var loseGold = Math.floor(Math.random() * (100 - 50 + 1)) + 50;
			character.gold -= loseGold;
			if(character.gold < 0) character.gold = 0;
			battleState.endMessages.push(loseGold + " gold was pilfered!");
		}
	}
}

exports.postresults.gold_boost_1 = function(character, battleState, eventId, actives){
	
	if(battleState.win){
					
		var gainGold = Math.floor(Math.random() * (50 - 20 + 1)) + 20;
		character.gold += gainGold;
		battleState.endMessages.push(gainGold + " extra gold was gained!");
	}
}

exports.postresults.assassinate = function(character, battleState, eventId, actives){
	
	if(!battleState.win){
					
		character.battlesLeft -= character.battlesLeft - 1;
		battleState.endMessages.push("The Grumbassassin stabbed your remaining battle stocks right out of you!");
	}
}