//Initialize DB functions
let dbfunc = require('../data/db.js');

//Initialize list of actives
const fs = require("fs");
let activesList = JSON.parse(fs.readFileSync("./values/actives.json", "utf8"));

//Character functions
let charfunc = require('../character/character.js');

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

	if(!battleState.win && !character.postresults.includes('poison_charm')){

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
			dbfunc.pushToState(character, eventId, active, active.battleStates, 1);
		}
		battleState.endMessages.push("You have been poisoned!");
	}
}

exports.postresults.pilfer = function(character, battleState, eventId, actives){

	if(!battleState.win){

		if(character.postresults.includes('fools_gold')){

			dbfunc.reduceDuration(character, [character.preresults, character.postresults], 'fools_gold', actives);
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

		var gainGold = Math.floor(Math.random() * (75 - 20 + 1)) + 25;
		character.gold += gainGold;
		battleState.endMessages.push(gainGold + " extra gold was gained!");
	}
}

exports.postresults.assassinate = function(character, battleState, eventId, actives){

	if(!battleState.win){

		character.battlesLeft -= character.battlesLeft - 1;
		battleState.hpLoss += charfunc.MAX_HP;
		battleState.endMessages.push("The Grumbassassin performed a swift grumbassassination!");
	}
}

exports.postresults.fear = function(character, battleState, eventId, actives){

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
			dbfunc.pushToState(character, eventId, active, active.battleStates, 1);
		}
		battleState.endMessages.push("You have been feared!");
	}
}

exports.postresults.permaboost = function(character, battleState, eventId, actives){

	if(battleState.win){

		var randomArray = ['pow', 'wis', 'def', 'res', 'spd', 'luk', 'pow'];
		var random = Math.floor(Math.random() * (randomArray.length - 1));
		var stat = randomArray[random];
		var statMod = stat + "Mod";
		character[statMod] += 1;
		charfunc.calculateStats(character);
		battleState.endMessages.push("You gained a permanent +1 boost to " + stat.toUpperCase());
	}
}

exports.postresults.brojob = function(character, battleState, eventId, actives){

		character.gold += 20;
		battleState.hpLoss = -20;
		battleState.endMessages.push("Bro gave you pocket change of 20 gold!");
}

exports.postresults.bleed = function(character, battleState, eventId, actives){

	if(!battleState.win){

		var active;
		if(character.postresults.includes(eventId)){

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

			character.resEq -= 5;
			character.defEq -= 5;
			active = activesList[eventId];
			dbfunc.pushToState(character, eventId, active, active.battleStates, 1);
		}
		charfunc.calculateStats(character);
		battleState.endMessages.push("You've started bleeding!");
	}
}

exports.postresults.petrify = function(character, battleState, eventId, actives){

	if(!battleState.win){

		var active;
		if(character.postresults.includes(eventId)){

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

			character.defEq += 50;
			character.powEq -= 100;
			active = activesList[eventId];
			dbfunc.pushToState(character, eventId, active, active.battleStates, 1);
		}
		charfunc.calculateStats(character);
		battleState.endMessages.push("You've been petrified!");
	}
}
