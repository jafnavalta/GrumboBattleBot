//Initialize DB
let dbfunc = require('../data/db.js');

//Initialize items
const fs = require("fs");
let activesList = JSON.parse(fs.readFileSync("./values/actives.json", "utf8"));

//State constants
let statefunc = require("./state.js");

//Battle functions
let battlefunc = require('../command/battle.js');

//Active functions
let characterfunc = require('../actives/active_character.js');
let grumbofunc = require('../actives/active_grumbo.js');

//Character functions, not to be confused with the active character functions, characterfunc
let charfunc = require('../character/character.js');

//////////////////
// BATTLE STATE //
//////////////////
/**
* Pre battle calculations. dmgMod is used for Bosses.
*/
exports.prebattle = function(message, args, character, battleState, actives, grumbo){

	battleState.levelDiffActual = character.level - battleState.enemyLevel;

	//Prebattle base/modifiers
	battleState.preMessages = [];
	battleState.chanceMod = 0;
	battleState.levelDiffMod = 0;
	battleState.minMod = 0;
	battleState.maxMod = 0;
	battleState.hpMod = 0;
	battleState.powMod = 0;
	battleState.wisMod = 0;
	battleState.dmgMod = 0;

	battlefunc.calculateCharacterMods(message, args, character, battleState, actives, grumbo);

	//Prebattle character active functions
	for(var i = character.prebattle.length - 1; i >= 0; i--){

		var eventId = character.prebattle[i];
		if(characterfunc.prebattle[eventId] != null){

			characterfunc.prebattle[eventId](message, character, battleState, eventId, actives, grumbo);
		}
	};

	//Prebattle Grumbo effects
	for(var i = grumbo.prebattle.length - 1; i >= 0; i--){

		var eventId = grumbo.prebattle[i];
		var eventActive = activesList[eventId];
		if(grumbofunc.prebattle[eventId] != null){

			var random = Math.random() * 100;
			if(random < character.res*0.8 && eventActive.effect == statefunc.BAD){

				battleState.preMessages.push(charfunc.resistMessage(eventActive.name));
			}
			else{

				grumbofunc.prebattle[eventId](message, character, battleState, eventId, actives, grumbo);
			}
		}
	};

	//Calculate prebattle variables
	battleState.levelDiff = character.level - battleState.enemyLevel + battleState.levelDiffMod;
	battleState.chance = Math.floor(Math.random() * 4) - 2 + battleState.chanceMod + battleState.powMod + battleState.wisMod + battleState.hpMod;
	battleState.chance += 48 + (battleState.levelDiff * 2);
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
* Pre results calculations. Bosses use battleState.win for phase calculations.
*/
exports.preresults = function(message, character, battleState, actives, grumbo){

	//Preresults base/modifiers
	battleState.preResMessages = [];
	battleState.expMod = 0;
	battleState.win = true;
	if(battleState.result >= battleState.chance){

		battleState.win = false;
		battleState.dmgMod = Math.ceil(battleState.dmgMod/1.8);
	}

	//Preresults character active functions
	for(var i = character.preresults.length - 1; i >= 0; i--){

		var eventId = character.preresults[i];
		if(characterfunc.preresults[eventId] != null){

			characterfunc.preresults[eventId](message, character, battleState, eventId, actives, grumbo);
		}
	};


	//Preresults Grumbo effects
	for(var i = grumbo.preresults.length - 1; i >= 0; i--){

		var eventId = grumbo.preresults[i];
		var eventActive = activesList[eventId];
		if(grumbofunc.preresults[eventId] != null){

			var random = Math.random() * 100;
			if(random < character.res*0.8 && eventActive.effect == statefunc.BAD){

				battleState.preResMessages.push(charfunc.resistMessage(eventActive.name));
			}
			else{

				grumbofunc.preresults[eventId](message, character, battleState, eventId, actives, grumbo);
			}
		}
	};

	//Calculate preresults variables
	if(battleState.win){

		battleState.exp = battlefunc.calculateBattleExp(character, battleState.levelDiff, battleState);
		battleState.gold = Math.ceil(battlefunc.calculateBattleGold(character, battleState.levelDiff) * (1 + (character.luk / 100)));
	}
}

/**
* Post results calculations. Bosses do not use classExp.
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

			characterfunc.postresults[eventId](message, character, battleState, eventId, actives, grumbo);
		}
	}

	//Postresults Grumbo effects
	for(var i = grumbo.postresults.length - 1; i >= 0; i--){

		var eventId = grumbo.postresults[i];
		var eventActive = activesList[eventId];
		if(grumbofunc.postresults[eventId] != null && !battleState.avoidPostResults){

			var random = Math.random() * 100;
			if(random < character.res*0.8 && eventActive.effect == statefunc.BAD){

				battleState.endMessages.push(charfunc.resistMessage(eventActive.name));
			}
			else{

				grumbofunc.postresults[eventId](message, character, battleState, eventId, actives, grumbo);
			}
		}
	}

	//FINAL character active functions after all other actives
	for(var i = character.final.length - 1; i >= 0; i--){

		var eventId = character.final[i];
		if(characterfunc.final[eventId] != null){

			characterfunc.final[eventId](message, character, battleState, eventId, actives, grumbo);
		}
	}
}
