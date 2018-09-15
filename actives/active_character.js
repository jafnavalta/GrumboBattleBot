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
	battleState.dmgMod += 3;
	dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
}

exports.prebattle.charm_of_wumbo = function(character, battleState, eventId, actives){

	if(!battleState.isBoss){

		battleState.minMod += 15;
		dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
	}
}

exports.prebattle.berserk_potion = function(character, battleState, eventId, actives){

	for(var i = 0; i < actives.length; i++){

		if(actives[i].id == eventId){

			battleState.chanceMod += actives[i].duration;
			battleState.chanceMod -= 5;
			battleState.dmgMod += actives[i].duration;
			battleState.dmgMod -= 5;
			break;
		}
	}
	dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
}

exports.prebattle.wild_swing = function(character, battleState, eventId, actives){

	var random = Math.random() * 100;
	if(random < character.pow/8){

		battleState.chanceMod += 10;
		battleState.dmgMod += 10;
		battleState.preMessages.push("You swung a wild one!");
	}
}

exports.prebattle.outsmart = function(character, battleState, eventId, actives){

	var random = Math.random() * 100;
	if(random < 35 && battleState.wisMod > 0){

		battleState.dmgMod += battleState.wisMod;
		battleState.wisMod = battleState.wisMod * 2;
		battleState.preMessages.push("You outsmarted the enemy!");
	}
}

exports.prebattle.throwing_shield = function(character, battleState, eventId, actives){

	battleState.chanceMod += Math.floor(character.def/3);
	battleState.dmgMod += 6;
	battleState.preMessages.push("You outsmarted the enemy!");
	dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
}

exports.prebattle.crimson = function(character, battleState, eventId, actives){

	battleState.maxMod += 5;
	var random = Math.random() * 100;
	var increase = (character.def/10) + (character.res*2);
	if(random < increase){

		battleState.chanceMod += 5;
		battleState.preMessages.push("Crimson increased chance of victory by 5%!");
	}
}

exports.prebattle.blood_potion = function(character, battleState, eventId, actives){

	battleState.chanceMod += Math.floor((Math.random() * 5) + 5);
	dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
}

exports.prebattle.holy = function(character, battleState, eventId, actives){

	var random = Math.random() * 100;
	if(random < character.res){

		battleState.chanceMod += Math.floor(character.wis/12);
		battleState.dmgMod += Math.ceil(character.wis/8);
		battleState.preMessages.push("Holy activated!");
	}
}

exports.prebattle.armory = function(character, battleState, eventId, actives){

	var random = Math.random() * 100;
	if(random < character.def/7){

		var mod = character.equips.length;
		if(mod > 12) mod = 12;
		battleState.chanceMod += mod;
		battleState.dmgMod += mod;
		battleState.preMessages.push("You produced your Armory!");
	}
}

exports.prebattle.recoil = function(character, battleState, eventId, actives){

	var random = Math.random() * 100;
	if(random < character.pow/10){

		var mod = Math.abs(character.pow - character.def);
		battleState.chanceMod += Math.floor(mod/5);
		battleState.dmgMod += Math.floor(mod/2);
		battleState.preMessages.push("Recoil affected the enemy!");
	}
}

exports.prebattle.revenge = function(character, battleState, eventId, actives){

	var random = Math.random() * 100;
	if(random < (100 - character.hp)/2){

		battleState.chanceMod += Math.floor(character.pow/12);
		battleState.dmgMod += Math.floor(character.pow/5);
		battleState.preMessages.push("You attack back in Revenge!");
	}
}

exports.prebattle.explosion = function(character, battleState, eventId, actives){

	if(battleState.isBoss){

		var random = Math.random() * 100;
		if(random < 15){

			battleState.dmgMod += Math.floor(character.wis/2);
			battleState.preMessages.push("Explosion significantly increased your damage!");
		}
	}
}

exports.prebattle.power_of_wealth = function(character, battleState, eventId, actives){

	var random = Math.random() * 100;
	if(random < character.luk*0.8){

		battleState.chanceMod += Math.floor(character.gold/1500);
		battleState.dmgMod += Math.floor(character.gold/150);
		battleState.preMessages.push("The enemy was shown the Power of Wealth!");
	}
}

exports.prebattle.quick_step = function(character, battleState, eventId, actives){

	var random = Math.random() * 100;
	if(random < character.spd){

		battleState.chanceMod += 4;
		battleState.preMessages.push("You quick stepped!");
	}
}

exports.prebattle.shield_bash = function(character, battleState, eventId, actives){

	var random = Math.random() * 100;
	if(random < 5){

		battleState.dmgMod += Math.floor(character.def/3);
		battleState.preMessages.push("You used Shield Bash!");
	}
}

////////////////////////////////////
// CHARACTER PRERESULTS FUNCTIONS //
////////////////////////////////////
exports.preresults.observation = function(character, battleState, eventId, actives){

	if(battleState.win && !battleState.isBoss){

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
		if(random < 4){

			battleState.win = true;
			battleState.preResMessages.push("The second chance succeeded!");
		}
	}
}

exports.preresults.stand_your_ground = function(character, battleState, eventId, actives){

	if(!battleState.win && !battleState.isBoss && battleState.levelDiffActual > 0){

		var random = Math.random() * 100;
		if(random < character.def/8){

			battleState.win = true;
			battleState.preResMessages.push("You stood your ground!");
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

		battleState.hpLoss = Math.ceil(battleState.hpLoss*0.75);
		battleState.endMessages.push("Your safety hat cut your damage in half!");
	}
}

exports.postresults.dodge = function(character, battleState, eventId, actives){

	var random = Math.random() * 100;
	if(random < 8){

		battleState.hpLoss = 0;
		battleState.noDmgTaken = true;
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

exports.postresults.mini_magnet = function(character, battleState, eventId, actives){

	character.gold += 20;
	battleState.endMessages.push("Mini Magnet collected 20 gold!");
}

//BOSS Crimson Grumbo
exports.postresults.crimson_blood = function(character, battleState, eventId, actives){

	var active;
	for(var i = 0; i < actives.length; i++){

		if(actives[i].id == eventId){

			active = actives[i];
			break;
		}
	}

	var random = Math.random() * 100;
	var remove = (character.def/10) + (character.res*2);
	if(random < remove){

		//Remove completely
		var index = character.postresults.indexOf(eventId);
		character.postresults.splice(index, 1);
		dbfunc.removeActive(active);
		battleState.endMessages.push("Crimson Blood was removed!");
	}
	else{

		//Check duration left
		if(active.duration <= 1){

			battleState.hpLoss += 100;
			battleState.endMessages.push("Crimson Blood completely consumed you!");
		}
		dbfunc.reduceDuration(character, [character.postresults], eventId, actives);
	}
}

exports.postresults.regen = function(character, battleState, eventId, actives){

	battleState.hpLoss -= 3;
}

exports.postresults.miracle = function(character, battleState, eventId, actives){

	battleState.miracle = false;
	var random = Math.random() * 100;
	if(random < character.res * 2){

		battleState.hpLoss -= 12;
		battleState.endMessages.push("Miracle reduced damage received!");
	}
	if(battleState.miracleUsed == null || battleState.miracleUsed == false){

		var random2 = Math.random() * 100;
		if(random2 < character.res * 2){

			battleState.miracle = true;
		}
	}
}

exports.postresults.stand_your_ground = function(character, battleState, eventId, actives){

	var random = Math.random() * 100;
	if(random < character.def/8){

		battleState.hpLoss -= 7;
		battleState.endMessages.push("You stood your ground!");
	}
}

exports.postresults.grab_bag = function(character, battleState, eventId, actives){

	var random = Math.random() * 100;
	if(random < 66){

		if(random < 33){

			battleState.exp += 10;
			battleState.endMessages.push("You pulled 10 experience out of the Grab Bag!");
		}
		else{

			battleState.gold += 25;
			battleState.endMessages.push("You pulled 25 gold out of the Grab Bag!");
		}
	}
}

exports.postresults.lifesteal = function(character, battleState, eventId, actives){

	var random = Math.random() * 100;
	if(random < 75){

		var stole = Math.ceil(character.pow * 0.02);
		battleState.hpLoss -= stole;
		battleState.endMessages.push("You lifestole for " + stole + " damage.");
	}
}

exports.postresults.barrier = function(character, battleState, eventId, actives){

	var random = Math.random() * 100;
	if(random < character.res){

		battleState.hpLoss -= Math.floor(character.wis/12);
		battleState.endMessages.push("Barrier reduced damage received!");
	}
}
