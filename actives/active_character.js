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
exports.final = {};

///////////////////////////////////
// CHARACTER PREBATTLE FUNCTIONS //
///////////////////////////////////
exports.prebattle.poison = function(character, battleState, eventId, actives, grumbo){

	battleState.chanceMod -= 5;
}

exports.prebattle.fear = function(character, battleState, eventId, actives, grumbo){

	var fearResults = Math.random() * 100;
	if(fearResults < 10){

		battleState.chanceMod -= 100;
		battleState.preMessages.push("You were overcome with fear!");
	}
	dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
}

exports.prebattle.battle_potion = function(character, battleState, eventId, actives, grumbo){

	if(battleState.levelDiffActual >= 0) battleState.chanceMod += 5;
	else if(battleState.levelDiffActual >= -5) battleState.chanceMod += 4;
	else if(battleState.levelDiffActual >= -10) battleState.chanceMod += 3;
	else if(battleState.levelDiffActual >= -15) battleState.chanceMod += 2;
	else battleState.chanceMod += 1;
	battleState.dmgMod += 3;
	dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
}

exports.prebattle.charm_of_wumbo = function(character, battleState, eventId, actives, grumbo){

	if(!battleState.isBoss){

		battleState.minMod += 15;
		dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
	}
}

exports.prebattle.berserk_potion = function(character, battleState, eventId, actives, grumbo){

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

exports.prebattle.wild_swing = function(character, battleState, eventId, actives, grumbo){

	var random = Math.random() * 100;
	if(random < character.pow/8){

		battleState.chanceMod += 10;
		battleState.dmgMod += 10;
		battleState.preMessages.push("You swung a wild one!");
	}
}

exports.prebattle.outsmart = function(character, battleState, eventId, actives, grumbo){

	var random = Math.random() * 100;
	if(random < 35 && battleState.wisMod > 0){

		battleState.dmgMod += battleState.wisMod;
		battleState.wisMod = battleState.wisMod * 2;
		battleState.preMessages.push("You outsmarted the enemy!");
	}
}

exports.prebattle.throwing_shield = function(character, battleState, eventId, actives, grumbo){

	battleState.chanceMod += Math.floor(character.def/3);
	battleState.dmgMod += 6;
	battleState.preMessages.push("You threw a shield at the enemy!");
	dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
}

exports.prebattle.crimson = function(character, battleState, eventId, actives, grumbo){

	battleState.maxMod += 4;
	var random = Math.random() * 100;
	var increase = (character.def/10) + (character.res*2);
	if(random < increase){

		battleState.chanceMod += 4;
		battleState.preMessages.push("Crimson increased chance of victory by 4%!");
	}
}

exports.prebattle.blood_potion = function(character, battleState, eventId, actives, grumbo){

	battleState.chanceMod += Math.floor((Math.random() * 5) + 5);
	dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
}

exports.prebattle.holy = function(character, battleState, eventId, actives, grumbo){

	var random = Math.random() * 100;
	if(random < character.res){

		battleState.chanceMod += Math.floor(character.wis/12);
		battleState.dmgMod += Math.ceil(character.wis/8);
		battleState.preMessages.push("Holy activated!");
	}
}

exports.prebattle.armory = function(character, battleState, eventId, actives, grumbo){

	var random = Math.random() * 100;
	if(random < character.def/7){

		var mod = character.equips.length;
		if(mod > 12) mod = 12;
		battleState.chanceMod += mod;
		battleState.dmgMod += mod;
		battleState.preMessages.push("You produced your Armory!");
	}
}

exports.prebattle.recoil = function(character, battleState, eventId, actives, grumbo){

	var random = Math.random() * 100;
	if(random < character.pow/10){

		var mod = Math.abs(character.wis - character.def);
		battleState.chanceMod += Math.floor(mod/3);
		battleState.dmgMod += Math.floor(mod/2);
		battleState.preMessages.push("Recoil affected the enemy!");
	}
}

exports.prebattle.revenge = function(character, battleState, eventId, actives, grumbo){

	var random = Math.random() * 100;
	if(random < (100 - character.hp)/1.5){

		battleState.chanceMod += Math.floor(character.pow/12);
		battleState.dmgMod += Math.floor(character.pow/5);
		battleState.preMessages.push("You attack back in Revenge!");
	}
}

exports.prebattle.explosion = function(character, battleState, eventId, actives, grumbo){

	if(battleState.isBoss){

		var random = Math.random() * 100;
		if(random < character.wis/11){

			battleState.dmgMod += Math.floor(character.wis/2);
			battleState.preMessages.push("Explosion significantly increased your damage!");
		}
	}
}

exports.prebattle.power_of_wealth = function(character, battleState, eventId, actives, grumbo){

	var random = Math.random() * 100;
	if(random < character.luk*0.8){

		battleState.chanceMod += Math.floor(character.gold/1500);
		battleState.dmgMod += Math.floor(character.gold/150);
		battleState.preMessages.push("The enemy was shown the Power of Wealth!");
	}
}

exports.prebattle.quick_step = function(character, battleState, eventId, actives, grumbo){

	var random = Math.random() * 100;
	if(random < character.spd){

		battleState.chanceMod += 4;
		battleState.preMessages.push("You quick stepped!");
	}
}

exports.prebattle.shield_bash = function(character, battleState, eventId, actives, grumbo){

	var random = Math.random() * 100;
	if(random < 5){

		battleState.dmgMod += Math.floor(character.def/3);
		battleState.preMessages.push("You used Shield Bash!");
	}
}

exports.prebattle.trip_mine = function(character, battleState, eventId, actives, grumbo){

	battleState.dmgMod += 10;
	dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
}

////////////////////////////////////
// CHARACTER PRERESULTS FUNCTIONS //
////////////////////////////////////
exports.preresults.observation = function(character, battleState, eventId, actives, grumbo){

	if(battleState.win && !battleState.isBoss){

		var random = Math.random() * 100;
		if(random < 10){

			battleState.expMod += Math.ceil(character.level/1.5);
			battleState.preResMessages.push("Your observations proved useful!");
		}
	}
}

exports.preresults.second_chance = function(character, battleState, eventId, actives, grumbo){

	if(!battleState.win){

		var random = Math.random() * 100;
		if(random < 4){

			battleState.win = true;
			battleState.preResMessages.push("The second chance succeeded!");
		}
	}
}

exports.preresults.stand_your_ground = function(character, battleState, eventId, actives, grumbo){

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
exports.postresults.poison = function(character, battleState, eventId, actives, grumbo){

	battleState.hpLoss += 5;
	dbfunc.reduceDuration(character, [character.prebattle, character.postresults], eventId, actives);
}

exports.postresults.flimsy_rope = function(character, battleState, eventId, actives, grumbo){

	battleState.avoidPostResults = false;
	var random = Math.random() * 100;
	if(random < 20){

		battleState.avoidPostResults = true;
		battleState.endMessages.push("Flimsy rope activated and let you avoid post battle effects!");
	}
	dbfunc.reduceDuration(character, [character.postresults], eventId, actives);
}

exports.postresults.bleed = function(character, battleState, eventId, actives, grumbo){

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

exports.postresults.petrify = function(character, battleState, eventId, actives, grumbo){

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

exports.postresults.root = function(character, battleState, eventId, actives, grumbo){

	for(var i = 0; i < actives.length; i++){

		if(actives[i].id == eventId){

			if(actives[i].duration <= 1){

				character.spdEq += 10;
				charfunc.calculateStats(character);
			}
			break;
		}
	}
	dbfunc.reduceDuration(character, [character.postresults], eventId, actives);
}

exports.postresults.grumbot_miner = function(character, battleState, eventId, actives, grumbo){

	var gainGold = Math.floor(Math.random() * 60) + 90;
	character.gold += gainGold;
	battleState.endMessages.push("Grumbot mined " + gainGold + " gold!");
	dbfunc.reduceDuration(character, [character.postresults], eventId, actives);
}

exports.postresults.mini_magnet = function(character, battleState, eventId, actives, grumbo){

	character.gold += 20;
	battleState.endMessages.push("Mini Magnet collected 20 gold!");
}

//BOSS Crimson Grumbo
exports.postresults.crimson_blood = function(character, battleState, eventId, actives, grumbo){

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

exports.postresults.regen = function(character, battleState, eventId, actives, grumbo){

	battleState.hpLoss -= 3;
}

exports.postresults.miracle = function(character, battleState, eventId, actives, grumbo){

	var random = Math.random() * 100;
	if(random < character.res * 2){

		battleState.hpLoss -= 12;
		battleState.endMessages.push("Miracle reduced damage received!");
	}
}

exports.postresults.grab_bag = function(character, battleState, eventId, actives, grumbo){

	var random = Math.random() * 100;
	if(random < 66 && !battleState.isBoss){

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

exports.postresults.lifesteal = function(character, battleState, eventId, actives, grumbo){

	var random = Math.random() * 100;
	if(random < 75){

		var stole = Math.ceil(character.pow * 0.02);
		battleState.hpLoss -= stole;
		battleState.endMessages.push("You lifestole for " + stole + " damage.");
	}
}

exports.postresults.barrier = function(character, battleState, eventId, actives, grumbo){

	var random = Math.random() * 100;
	if(random < character.res){

		battleState.hpLoss -= Math.floor(character.wis/12);
		battleState.endMessages.push("Barrier reduced damage received!");
	}
}

exports.postresults.study = function(character, battleState, eventId, actives, grumbo){

	if(!battleState.isBoss){

		var random = Math.random() * 100;
		if(random < 12){

			battleState.classExp += 1;
			battleState.endMessages.push("You studied for extra class experience!");
		}
	}
}

exports.postresults.grumbo_whistle = function(character, battleState, eventId, actives, grumbo){

	if(character.gold >= 94){

		character.gold -= 94;
		var random = Math.random() * 100;
		if(random < 50){

			battleState.hpLoss -= 5;
			battleState.endMessages.push("Grumbo came by and reduced damage recieved by 5!");
		}
		else{

			battleState.dmgMod += 20;
			if(battleState.isBoss){

				battleState.endMessages.push("Grumbo came by and dealt an additional 20 damage!");
			}
		}
	}
}

exports.postresults.safety_boots = function(character, battleState, eventId, actives, grumbo){

	if(character.hp < 50){

		battleState.hpLoss -= 2;
		battleState.endMessages.push("Your safety boots cut your damage by 2!");
	}
}

exports.postresults.adrenaline = function(character, battleState, eventId, actives, grumbo){

	if(battleState.adrenaline == null && character.hp <= 10){

		battleState.adrenaline = true;
		battleState.hpLoss -= 20;
		battleState.endMessages.push("Adrenaline popped!");
		dbfunc.reduceDuration(character, [character.postresults], eventId, actives);
	}
}

exports.postresults.stimulus = function(character, battleState, eventId, actives, grumbo){

	if(battleState.stimulus == null && character.hp <= 20){

		battleState.stimulus = true;
		battleState.dmgMod += 40;
		battleState.endMessages.push("Stimulus popped!");
		dbfunc.reduceDuration(character, [character.postresults], eventId, actives);
	}
}

exports.postresults.conceal = function(character, battleState, eventId, actives, grumbo){

	var random = Math.random() * 100;
	if(random < character.spd){

		battleState.hpLoss -= 5;
		battleState.dmgMod += 10;
		battleState.endMessages.push("You revealed the concealed knife!");
	}
}

///////////////////////////////
// CHARACTER FINAL FUNCTIONS //
///////////////////////////////
exports.final.vision = function(character, battleState, eventId, actives, grumbo){

	var random = Math.random() * 100;
	if(random < 20){

		battleState.hpLoss -= character.res;
		if(battleState.hpLoss < 0) battleState.hpLoss = 0;
		battleState.endMessages.push("Your vision helped you dodge significant damage!");
	}
}

exports.final.stand_your_ground = function(character, battleState, eventId, actives, grumbo){

	var random = Math.random() * 100;
	if(random < character.def/8){

		battleState.hpLoss -= 7;
		if(battleState.hpLoss < 0) battleState.hpLoss = 0;
		battleState.endMessages.push("You stood your ground!");
	}
}

exports.final.safety_hat = function(character, battleState, eventId, actives, grumbo){

	if(character.hp < 50){

		battleState.hpLoss = Math.ceil(battleState.hpLoss*0.7);
		battleState.endMessages.push("Your safety hat cut your damage by 30%!");
	}
}

exports.final.dodge = function(character, battleState, eventId, actives, grumbo){

	var random = Math.random() * 100;
	if(random < 8){

		battleState.hpLoss = 0;
		battleState.noDmgTaken = true;
		battleState.endMessages.push("You dodged all attacks!");
	}
}

exports.final.miracle = function(character, battleState, eventId, actives, grumbo){

	if(battleState.miracle == null){

		var random = Math.random() * 100;
		if(random < character.res * 2){

			if(battleState.hpLoss >= character.hp){

				battleState.miracle = true;
				battleState.hpLoss = character.hp - 1;
				battleState.endMessages.push("Miracle saved your life!");
			}
		}
	}
}

exports.final.guardian_angel = function(character, battleState, eventId, actives, grumbo){

	var random = Math.random() * 100;
	if(random < 10){

		if(battleState.hpLoss >= character.hp){

			character.hp = character.res;
			battleState.hpLoss = 0;
			battleState.endMessages.push("You were saved by a Guardian Angel!");
		}
	}
}

exports.final.master_grumbos_protection = function(character, battleState, eventId, actives, grumbo){

	if(battleState.hpLoss >= character.hp){

		var random = Math.random() * 100;
		if(random < 25){

			battleState.hpLoss = 0;
			battleState.dmgMod = character.res;
			battleState.endMessages.push("Master Grumbo has given you another chance!");
		}
	}
}

exports.final.blessed = function(character, battleState, eventId, actives, grumbo){

	if(!battleState.isBoss){

		var random = Math.random() * 100;
		if(random < 0.7){

			var randomArray = ['pow', 'wis', 'def', 'res', 'spd', 'luk', 'pow'];
			var random2 = Math.floor(Math.random() * (randomArray.length - 1));
			var stat = randomArray[random2];
			var statMod = stat + "Mod";
			character[statMod] += 1;
			charfunc.calculateStats(character);
			battleState.endMessages.push("You were blessed with a permanent +1 boost to " + stat.toUpperCase() + "!");
		}
	}
}
