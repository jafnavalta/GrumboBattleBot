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

///////////////////////////////////
// CHARACTER PREBATTLE FUNCTIONS //
///////////////////////////////////
exports.prebattle.poison = function(character, battleState, eventId, actives){

	battleState.chanceMod -= 5;
}

exports.prebattle.fear = function(character, battleState, eventId, actives){

	var fearResults = Math.random() * 100;
	if(fearResults < 10){

		battleState.chanceMod -= 100;
		battleState.preMessages.push("You were overcome with fear!");
	}
	dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
}

exports.prebattle.battle_potion = function(character, battleState, eventId, actives){

	if(battleState.levelDiffActual >= 0) battleState.chanceMod += 5;
	else if(battleState.levelDiffActual >= -5) battleState.chanceMod += 4;
	else if(battleState.levelDiffActual >= -10) battleState.chanceMod += 3;
	else if(battleState.levelDiffActual >= -15) battleState.chanceMod += 2;
	else battleState.chanceMod += 1;
	dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
}

exports.prebattle.charm_of_wumbo = function(character, battleState, eventId, actives){

	battleState.minMod += 15;
	dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
}

exports.prebattle.berserk_potion = function(character, battleState, eventId, actives){

	for(var i = 0; i < actives.length; i++){

		if(actives[i].id == eventId){

			battleState.chanceMod += actives[i].duration;
			battleState.chanceMod -= 5;
			break;
		}
	}
	dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
}

exports.prebattle.wild_swing = function(character, battleState, eventId, actives){

	var random = Math.random() * 100;
	if(random < character.pow/8){

		battleState.chanceMod += 10;
		battleState.preMessages.push("You swung a wild one!");
	}
}

exports.prebattle.outsmart = function(character, battleState, eventId, actives){

	var random = Math.random() * 100;
	if(random < 35 && battleState.wisMod > 0){

		battleState.wisMod = battleState.wisMod * 2;
		battleState.preMessages.push("You outsmarted the enemy!");
	}
}

exports.prebattle.throwing_shield = function(character, battleState, eventId, actives){

	battleState.chanceMod += Math.floor(character.def/3);
	battleState.preMessages.push("You outsmarted the enemy!");
	dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
}

////////////////////////////////////
// CHARACTER PRERESULTS FUNCTIONS //
////////////////////////////////////
exports.preresults.observation = function(character, battleState, eventId, actives){

	if(battleState.win){

		var random = Math.random() * 100;
		if(random < 10){

			battleState.expMod += Math.ceil(character.level/1.5);
			battleState.preResMessages.push("Your observations proved useful!");
		}
	}
}

exports.preresults.second_chance = function(character, battleState, eventId, actives){

	if(!battleState.win){

		var random = Math.random() * 100;
		if(random < 3){

			battleState.win = true;
			battleState.preResMessages.push("The second chance succeeded!");
		}
	}
}

/////////////////////////////////////
// CHARACTER POSTRESULTS FUNCTIONS //
/////////////////////////////////////
exports.postresults.poison = function(character, battleState, eventId, actives){

	battleState.hpLoss += 5;
	dbfunc.reduceDuration(character, [character.prebattle, character.postresults], eventId, actives);
}

exports.postresults.flimsy_rope = function(character, battleState, eventId, actives){

	var random = Math.random() * 100;
	if(random < 50){

		battleState.avoidPostResults = true;
		battleState.endMessages.push("Flimsy rope activated and let you avoid post battle effects!");
	}
	dbfunc.reduceDuration(character, [character.postresults], eventId, actives);
}

exports.postresults.safety_hat = function(character, battleState, eventId, actives){

	if(character.hp < 50){

		battleState.hpLoss = Math.ceil(battleState.hpLoss/2);
		battleState.endMessages.push("Your safety hat cut your damage in half!");
	}
}

exports.postresults.dodge = function(character, battleState, eventId, actives){

	var random = Math.random() * 100;
	if(random < 8){

		battleState.hpLoss = 0;
		battleState.endMessages.push("You dodged all attacks!");
	}
}

exports.postresults.vision = function(character, battleState, eventId, actives){

	var random = Math.random() * 100;
	if(random < 20){

		battleState.hpLoss -= character.res;
		if(battleState.hpLoss < 0) battleState.hpLoss = 0;
		battleState.endMessages.push("Your vision helped you dodge significant damage!");
	}
}

exports.postresults.bleed = function(character, battleState, eventId, actives){

	for(var i = 0; i < actives.length; i++){

		if(actives[i].id == eventId){

			battleState.hpLoss += actives[i].duration;
			if(actives[i].duration <= 1){

				character.resEq += 5;
				character.defEq += 5;
				charfunc.calculateStats(character);
			}
			break;
		}
	}
	dbfunc.reduceDuration(character, [character.postresults], eventId, actives);
}

exports.postresults.petrify = function(character, battleState, eventId, actives){

	for(var i = 0; i < actives.length; i++){

		if(actives[i].id == eventId){

			if(actives[i].duration <= 1){

				character.defEq -= 50;
				character.powEq += 100;
				charfunc.calculateStats(character);
			}
			break;
		}
	}
	dbfunc.reduceDuration(character, [character.postresults], eventId, actives);
}

exports.postresults.grumbot_miner = function(character, battleState, eventId, actives){

	var gainGold = Math.floor(Math.random() * 60) + 90;
	character.gold += gainGold;
	battleState.endMessages.push("Grumbot mined " + gainGold + " gold!");
	dbfunc.reduceDuration(character, [character.postresults], eventId, actives);
}
