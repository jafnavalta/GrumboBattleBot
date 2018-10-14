//Initialize DB
let dbfunc = require('../data/db.js');

//Initialize items
const fs = require("fs");
let activesList = JSON.parse(fs.readFileSync("./values/actives.json", "utf8"));

//State constants
let statefunc = require("./state.js");

//Battle functions
let battlefunc = require('../command/battle.js');
let bossfunc = require('../command/boss.js');
let raidfunc = require('../command/raid.js');

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
exports.character_prebattle = function(message, args, character, battleState, actives, grumbo, characters){

	//Prebattle base/modifiers
	battleState.levelDiffActual = 0;
	battleState.preMessages = [];
	battleState.chanceMod = 0;
	battleState.minMod = 0;
	battleState.maxMod = 0;
	battleState.hpMod = 0;
	battleState.powMod = 0;
	battleState.wisMod = 0;
	battleState.sklMod = 0;
	battleState.dmgMod = 0;
  battleState.hpLoss = 0;

	raidfunc.calculateCharacterMods(message, args, character, battleState, actives, grumbo);

	//Prebattle character active functions
	for(var i = character.prebattle.length - 1; i >= 0; i--){

		var eventId = character.prebattle[i];
    var eventActive = activesList[eventId];
		if(characterfunc.prebattle[eventId] != null && (eventActive.turn_prebattle == statefunc.CHARACTER || eventActive.turn_prebattle == statefunc.BOTH)){

			characterfunc.prebattle[eventId](message, character, battleState, eventId, actives, grumbo, characters);
		}
	};

	//Prebattle Grumbo effects
	for(var i = grumbo.prebattle.length - 1; i >= 0; i--){

		var eventId = grumbo.prebattle[i];
		var eventActive = activesList[eventId];
		if(grumbofunc.prebattle[eventId] != null){

			var random = Math.random() * 100;
			if(random < character.res && eventActive.effect == statefunc.BAD){

				battleState.preMessages.push(charfunc.resistMessage(eventActive.name));
			}
			else{

				grumbofunc.prebattle[eventId](message, character, battleState, eventId, actives, grumbo, characters);
			}
		}
	};

	//Calculate prebattle variables
	battleState.chance = Math.floor(Math.random() * 4) - 2 + battleState.chanceMod + battleState.powMod + battleState.wisMod + battleState.sklMod + battleState.hpMod;
	battleState.chance += grumbo.base_chance;
	var charDmg = character.pow;
	if(charDmg < character.wis) charDmg = Math.ceil(character.wis * (0.95));
	battleState.dmgMod += Math.ceil(charDmg * 0.8) + Math.floor((Math.random()*15) - 7);
	var max = 95 + battleState.maxMod;
	var min = 5 + battleState.minMod;
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
exports.character_preresults = function(message, args, character, battleState, actives, grumbo, characters){

	//Preresults base/modifiers
	battleState.preResMessages = [];
	battleState.win = true;
	if(battleState.result >= battleState.chance){

		battleState.win = false;
		var sklShrink = battleState.sklMod/100;
		if(sklShrink < 0) sklShrink = 0;
		var divider = 5 - (sklShrink*3);
		if(divider < 4) divider = 4;
		battleState.dmgMod = Math.ceil(battleState.dmgMod/divider);
	}

	//Preresults character active functions
	for(var i = character.preresults.length - 1; i >= 0; i--){

		var eventId = character.preresults[i];
    var eventActive = activesList[eventId];
		if(characterfunc.preresults[eventId] != null && (eventActive.turn_preresults == statefunc.CHARACTER || eventActive.turn_preresults == statefunc.BOTH)){

			characterfunc.preresults[eventId](message, character, battleState, eventId, actives, grumbo, characters);
		}
	};


	//Preresults Grumbo effects
	for(var i = grumbo.preresults.length - 1; i >= 0; i--){

		var eventId = grumbo.preresults[i];
		var eventActive = activesList[eventId];
		if(grumbofunc.preresults[eventId] != null){

			var random = Math.random() * 100;
			if(random < character.res && eventActive.effect == statefunc.BAD){

				battleState.preResMessages.push(charfunc.resistMessage(eventActive.name));
			}
			else{

				grumbofunc.preresults[eventId](message, character, battleState, eventId, actives, grumbo, characters);
			}
		}
	};
}

/**
* Post results calculations. Bosses do not use classExp.
*/
exports.character_postresults = function(message, args, character, battleState, actives, grumbo, characters){

	//Postresults base/modifiers
	battleState.endMessages = [];
	battleState.avoidPostResults = false;

	//Postresults character active functions
	for(var i = character.postresults.length - 1; i >= 0; i--){

		var eventId = character.postresults[i];
    var eventActive = activesList[eventId];
		if(characterfunc.postresults[eventId] != null && (eventActive.turn_postresults == statefunc.CHARACTER || eventActive.turn_postresults == statefunc.BOTH)){

			characterfunc.postresults[eventId](message, character, battleState, eventId, actives, grumbo, characters);
		}
	}

	//Postresults Grumbo effects
	for(var i = grumbo.postresults.length - 1; i >= 0; i--){

		var eventId = grumbo.postresults[i];
		var eventActive = activesList[eventId];
		if(grumbofunc.postresults[eventId] != null && !battleState.avoidPostResults){

			var random = Math.random() * 100;
			if(random < character.res && eventActive.effect == statefunc.BAD){

				battleState.endMessages.push(charfunc.resistMessage(eventActive.name));
			}
			else{

				grumbofunc.postresults[eventId](message, character, battleState, eventId, actives, grumbo, characters);
			}
		}
	}

	//FINAL character active functions after all other actives
	for(var i = character.final.length - 1; i >= 0; i--){

		var eventId = character.final[i];
    var eventActive = activesList[eventId];
		if(characterfunc.final[eventId] != null && (eventActive.turn_final == statefunc.CHARACTER || eventActive.turn_final == statefunc.BOTH)){

			characterfunc.final[eventId](message, character, battleState, eventId, actives, grumbo, characters);
		}
	}
}

///////////////////////
// BOSS BATTLE STATE //
///////////////////////
/**
* Pre battle calculations. dmgMod is used for Bosses.
*/
exports.boss_prebattle = function(message, args, character, battleState, actives, grumbo, characters, raidActive){

	//Prebattle base/modifiers
	battleState.levelDiffActual = 0;
	battleState.preMessages = [];
	battleState.chanceMod = 0;
	battleState.minMod = 0;
	battleState.maxMod = 0;
	battleState.hpMod = 0;
	battleState.powMod = 0;
	battleState.wisMod = 0;
	battleState.sklMod = 0;
	battleState.dmgMod = 0;
  battleState.hpLoss = 0;

	//Prebattle character active functions
	for(var i = character.prebattle.length - 1; i >= 0; i--){

		var eventId = character.prebattle[i];
    var eventActive = activesList[eventId];
		if(characterfunc.prebattle[eventId] != null && (eventActive.turn_prebattle == statefunc.BOSS || eventActive.turn_prebattle == statefunc.BOTH)){

			characterfunc.prebattle[eventId](message, character, battleState, eventId, actives, grumbo, characters);
		}
	};

	//Prebattle Grumbo effects
  var random = Math.random() * 100;
  if(random < character.res && raidActive.effect == statefunc.BAD){

    battleState.preMessages.push(charfunc.resistMessage(raidActive.name));
  }
  else if(grumbofunc.prebattle[raidActive.id] != null){

    grumbofunc.prebattle[raidActive.id](message, character, battleState, raidActive.id, actives, grumbo, characters);
  }
}

/**
* Pre results calculations. Bosses use battleState.win for phase calculations.
*/
exports.boss_preresults = function(message, args, character, battleState, actives, grumbo, characters, raidActive){

	//Preresults base/modifiers
	battleState.preResMessages = [];

	//Preresults character active functions
	for(var i = character.preresults.length - 1; i >= 0; i--){

		var eventId = character.preresults[i];
    var eventActive = activesList[eventId];
		if(characterfunc.preresults[eventId] != null && (eventActive.turn_preresults == statefunc.BOSS || eventActive.turn_preresults == statefunc.BOTH)){

			characterfunc.preresults[eventId](message, character, battleState, eventId, actives, grumbo, characters);
		}
	};


	//Preresults Grumbo effects
  var random = Math.random() * 100;
  if(random < character.res && raidActive.effect == statefunc.BAD){

    battleState.preResMessages.push(charfunc.resistMessage(raidActive.name));
  }
  else if(grumbofunc.preresults[raidActive.id] != null){

    grumbofunc.preresults[raidActive.id](message, character, battleState, raidActive.id, actives, grumbo, characters);
  }
}

/**
* Post results calculations. Bosses do not use classExp.
*/
exports.boss_postresults = function(message, args, character, battleState, actives, grumbo, characters, raidActive){

	//Postresults base/modifiers
	battleState.endMessages = [];
	battleState.avoidPostResults = false;

	//Postresults character active functions
	for(var i = character.postresults.length - 1; i >= 0; i--){

		var eventId = character.postresults[i];
    var eventActive = activesList[eventId];
		if(characterfunc.postresults[eventId] != null && (eventActive.turn_postresults == statefunc.BOSS || eventActive.turn_postresults == statefunc.BOTH)){

			characterfunc.postresults[eventId](message, character, battleState, eventId, actives, grumbo, characters);
		}
	}

	//Postresults Grumbo effects
  var random = Math.random() * 100;
  if(random < character.res && raidActive.effect == statefunc.BAD){

    battleState.endMessages.push(charfunc.resistMessage(raidActive.name));
  }
  else if(grumbofunc.postresults[raidActive.id] != null){

    grumbofunc.postresults[raidActive.id](message, character, battleState, raidActive.id, actives, grumbo, characters);
  }

	//FINAL character active functions after all other actives
	for(var i = character.final.length - 1; i >= 0; i--){

		var eventId = character.final[i];
    var eventActive = activesList[eventId];
		if(characterfunc.final[eventId] != null && (eventActive.turn_final == statefunc.BOSS || eventActive.turn_final == statefunc.BOTH)){

			characterfunc.final[eventId](message, character, battleState, eventId, actives, grumbo, characters);
		}
	}
}
