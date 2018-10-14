//Initialize DB functions
let dbfunc = require('../data/db.js');

//Initialize list of actives
const fs = require("fs");
let activesList = JSON.parse(fs.readFileSync("./values/actives.json", "utf8"));

//State constants
let statefunc = require('../state/state.js');

//Character functions
let charfunc = require('../character/character.js');

//Raid functions
let raidfunc = require('../command/raid.js');

//Initialize states
exports.prebattle = {};
exports.preresults = {};
exports.postresults = {};
exports.final = {};

///////////////////////////////////
// CHARACTER PREBATTLE FUNCTIONS //
///////////////////////////////////
exports.prebattle.poison = function(message, character, battleState, eventId, actives, grumbo, characters){

	battleState.chanceMod -= 5;
}

exports.prebattle.alphav = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.state == statefunc.BATTLE){

		battleState.chanceMod += 1;
	}
	else{

		battleState.chanceMod += 5;
	}
}

exports.prebattle.fear = function(message, character, battleState, eventId, actives, grumbo, characters){

	var fearResults = Math.random() * 100;
	if(fearResults < 10){

		battleState.chanceMod -= 100;
		battleState.preMessages.push("You were overcome with fear!");
	}
	dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
}

exports.prebattle.battle_potion = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.levelDiffActual >= 0) battleState.chanceMod += 5;
	else if(battleState.levelDiffActual >= -5) battleState.chanceMod += 4;
	else if(battleState.levelDiffActual >= -10) battleState.chanceMod += 3;
	else if(battleState.levelDiffActual >= -15) battleState.chanceMod += 2;
	else battleState.chanceMod += 1;
	battleState.dmgMod += 3;
	dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
}

exports.prebattle.charm_of_wumbo = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.state == statefunc.BATTLE){

		battleState.minMod += 15;
		dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
	}
}

exports.prebattle.berserk_potion = function(message, character, battleState, eventId, actives, grumbo, characters){

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

exports.prebattle.wild_swing = function(message, character, battleState, eventId, actives, grumbo, characters){

	var random = Math.random() * 100;
	if(random < character.pow/8){

		battleState.chanceMod += 10;
		battleState.dmgMod += 10;
		battleState.preMessages.push("You swung a wild one!");
	}
}

exports.prebattle.outsmart = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.multi_cast == null){

		battleState.multi_cast = {};
		battleState.multi_cast[character._id] = 0;
	}
	var random = Math.random() * 100;
	if(random < 18 && battleState.wisMod > 0){

		battleState.multi_cast[character._id] += 1;
		battleState.dmgMod += battleState.wisMod;
		battleState.chanceMod += battleState.wisMod;
		battleState.preMessages.push("You outsmarted the enemy!");
	}
}

exports.prebattle.throwing_shield = function(message, character, battleState, eventId, actives, grumbo, characters){

	battleState.chanceMod += Math.floor(character.def/3);
	battleState.dmgMod += 6;
	battleState.preMessages.push("You threw a shield at the enemy!");
	dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
}

exports.prebattle.crimson = function(message, character, battleState, eventId, actives, grumbo, characters){

	battleState.maxMod += 3;
	var random = Math.random() * 100;
	var increase = (character.def/10) + (character.res);
	if(random < increase){

		battleState.chanceMod += 3;
		battleState.preMessages.push("Crimson increased chance of victory by 3%!");
	}
}

exports.prebattle.blood_potion = function(message, character, battleState, eventId, actives, grumbo, characters){

	battleState.chanceMod += Math.floor((Math.random() * 5) + 5);
	dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
}

exports.prebattle.holy = function(message, character, battleState, eventId, actives, grumbo, characters){

	var random = Math.random() * 100;
	if(random < character.res/2.2){

		battleState.chanceMod += Math.floor(character.wis/12);
		battleState.dmgMod += Math.ceil(character.wis/8);
		battleState.preMessages.push("Holy activated!");
	}
}

exports.prebattle.armory = function(message, character, battleState, eventId, actives, grumbo, characters){

	var random = Math.random() * 100;
	if(random < character.def/7){

		var mod = character.equips.length;
		if(mod > 12) mod = 12;
		battleState.chanceMod += mod;
		battleState.dmgMod += mod;
		battleState.preMessages.push("You produced your Armory!");
	}
}

exports.prebattle.recoil = function(message, character, battleState, eventId, actives, grumbo, characters){

	var random = Math.random() * 100;
	if(random < character.pow/10){

		var mod = Math.ceil(Math.abs((character.wis*0.9) - (character.def*1.1)));
		battleState.chanceMod += Math.floor(mod/3);
		battleState.dmgMod += Math.floor(mod/1.5);
		battleState.preMessages.push("Recoil affected the enemy!");
	}
}

exports.prebattle.revenge = function(message, character, battleState, eventId, actives, grumbo, characters){

	var random = Math.random() * 100;
	if(random < (character.maxHP - character.hp)/2.25){

		var up = Math.floor(character.pow/15);
		if(up > 20) up = 20;
		battleState.chanceMod += up;
		battleState.dmgMod += Math.floor(character.pow/5);
		battleState.preMessages.push("You attack back in Revenge!");
	}
}

exports.prebattle.explosion = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.state != statefunc.BATTLE){

		if(battleState.multi_cast == null){

			battleState.multi_cast = {};
			battleState.multi_cast[character._id] = 0;
		}
		var random = Math.random() * 100;
		if(random < character.wis/11){

			battleState.multi_cast[character._id] += 1;
			battleState.dmgMod += Math.floor(character.wis/2);
			battleState.preMessages.push("Explosion significantly increased your damage!");
		}
	}
}

exports.prebattle.power_of_wealth = function(message, character, battleState, eventId, actives, grumbo, characters){

	var random = Math.random() * 100;
	if(random < character.luk*0.8){

		var chanceUp = Math.floor(character.gold/1500);
		if(chanceUp > 20) chanceUp = 20;
		battleState.chanceMod += 20;
		var dmgUp = Math.floor(character.gold/150);
		if(dmgUp > 200) dmgUp = 200;
		battleState.dmgMod += dmgUp;
		battleState.preMessages.push("The enemy was shown the Power of Wealth!");
	}
}

exports.prebattle.quick_step = function(message, character, battleState, eventId, actives, grumbo, characters){

	var random = Math.random() * 100;
	if(random < character.spd){

		battleState.chanceMod += 5;
		battleState.preMessages.push("You quick stepped!");
	}
}

exports.prebattle.shield_bash = function(message, character, battleState, eventId, actives, grumbo, characters){

	var random = Math.random() * 100;
	if(random < 5){

		battleState.dmgMod += Math.floor(character.def/3);
		battleState.preMessages.push("You used Shield Bash!");
	}
}

exports.prebattle.trip_mine = function(message, character, battleState, eventId, actives, grumbo, characters){

	battleState.dmgMod += 10;
	battleState.preMessages.push("A trip mine exploded!");
	dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
}

exports.prebattle.double_attack = function(message, character, battleState, eventId, actives, grumbo, characters){

	battleState.double_attack = false;
	var random = Math.random() * 100;
	if(random < character.spd/2.5){

		battleState.double_attack = true;
		battleState.chanceMod += Math.ceil(character.spd/5);
		battleState.preMessages.push("You double attacked!");
	}
}

exports.prebattle.sureshot = function(message, character, battleState, eventId, actives, grumbo, characters){

	var random = Math.random() * 100;
	if(random < character.skl/7.5 && battleState.state != statefunc.BATTLE){

		battleState.chanceMod += 20;
		battleState.preMessages.push("Sureshot massively increased chance of victory!");
	}
}

exports.prebattle.chance_up = function(message, character, battleState, eventId, actives, grumbo, characters){

	battleState.chanceMod += 10;
	battleState.preMessages.push("The enemy is marked!");
	dbfunc.reduceDuration(character, [character.prebattle], eventId, actives);
}

exports.prebattle.rampage = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.rampage == null){

		battleState.rampage = {};
		battleState.rampage[character._id] = 0;
	}
	if(battleState.rampage[character._id] < 30){

		battleState.rampage[character._id] += 2;
	}
	battleState.chanceMod += Math.floor(battleState.rampage[character._id]/2);
}

exports.prebattle.multi_cast = function(message, character, battleState, eventId, actives, grumbo, characters){

	battleState.chanceMod += Math.floor(actives.length/3);
}

////////////////////////////////////
// CHARACTER PRERESULTS FUNCTIONS //
////////////////////////////////////
exports.preresults.observation = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.win && battleState.state == statefunc.BATTLE){

		var random = Math.random() * 100;
		if(random < 7.5){

			battleState.expMod += Math.ceil(character.level/1.5);
			battleState.preResMessages.push("Your observations proved useful!");
		}
	}
}

exports.preresults.second_chance = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(!battleState.win){

		var random = Math.random() * 100;
		if(random < 7){

			battleState.win = true;
			battleState.preResMessages.push("The second chance succeeded!");
		}
	}
}

exports.preresults.stand_your_ground = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(!battleState.win && battleState.state == statefunc.BATTLE && battleState.levelDiffActual > 0){

		var random = Math.random() * 100;
		if(random < character.def/8){

			battleState.win = true;
			battleState.preResMessages.push("You stood your ground!");
		}
	}
}

exports.preresults.double_attack = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.double_attack){

		battleState.dmgMod += battleState.dmgMod;
	}
}

/////////////////////////////////////
// CHARACTER POSTRESULTS FUNCTIONS //
/////////////////////////////////////
exports.postresults.poison = function(message, character, battleState, eventId, actives, grumbo, characters){

	battleState.hpLoss += Math.floor(character.maxHP * 0.05);
	dbfunc.reduceDuration(character, [character.prebattle, character.postresults], eventId, actives);
}

exports.postresults.flimsy_rope = function(message, character, battleState, eventId, actives, grumbo, characters){

	battleState.avoidPostResults = false;
	var random = Math.random() * 100;
	if(random < 20){

		battleState.avoidPostResults = true;
		battleState.endMessages.push("Flimsy rope activated and let you avoid post battle effects!");
	}
	dbfunc.reduceDuration(character, [character.postresults], eventId, actives);
}

exports.postresults.bleed = function(message, character, battleState, eventId, actives, grumbo, characters){

	for(var i = 0; i < actives.length; i++){

		if(actives[i].id == eventId){

			battleState.hpLoss += Math.floor(character.maxHP * (actives[i].duration/100));
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

exports.postresults.paralyze = function(message, character, battleState, eventId, actives, grumbo, characters){

	for(var i = 0; i < actives.length; i++){

		if(actives[i].id == eventId){

			if(actives[i].duration <= 1){

				character.resEq += actives[i].value;
				charfunc.calculateStats(character);
			}
			break;
		}
	}
	battleState.dmgMod = 0;
	dbfunc.reduceDuration(character, [character.postresults], eventId, actives);
}

exports.postresults.curse = function(message, character, battleState, eventId, actives, grumbo, characters){

	for(var i = 0; i < actives.length; i++){

		if(actives[i].id == eventId){

			if(actives[i].duration <= 1){

				character.hpEq += actives[i].value;
				charfunc.calculateStats(character);
			}
			break;
		}
	}
	dbfunc.reduceDuration(character, [character.postresults], eventId, actives);
}

exports.postresults.growth_pill = function(message, character, battleState, eventId, actives, grumbo, characters){

	for(var i = 0; i < actives.length; i++){

		if(actives[i].id == eventId){

			if(actives[i].duration <= 1){

				character.hpEq -= 20;
				charfunc.calculateStats(character);
			}
			break;
		}
	}
	dbfunc.reduceDuration(character, [character.postresults], eventId, actives);
}

exports.postresults.petrify = function(message, character, battleState, eventId, actives, grumbo, characters){

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

exports.postresults.root = function(message, character, battleState, eventId, actives, grumbo, characters){

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

exports.postresults.blind = function(message, character, battleState, eventId, actives, grumbo, characters){

	for(var i = 0; i < actives.length; i++){

		if(actives[i].id == eventId){

			if(actives[i].duration <= 1){

				character.sklEq += 30;
				charfunc.calculateStats(character);
			}
			break;
		}
	}
	dbfunc.reduceDuration(character, [character.postresults], eventId, actives);
}

exports.postresults.grumbot_miner = function(message, character, battleState, eventId, actives, grumbo, characters){

	var gainGold = Math.floor(Math.random() * 60) + 90;
	character.gold += gainGold;
	battleState.endMessages.push("Grumbot mined " + gainGold + " gold!");
	dbfunc.reduceDuration(character, [character.postresults], eventId, actives);
}

exports.postresults.mini_magnet = function(message, character, battleState, eventId, actives, grumbo, characters){

	character.gold += 20;
	battleState.endMessages.push("Mini Magnet collected 20 gold!");
}

//BOSS Crimson Grumbo
exports.postresults.crimson_blood = function(message, character, battleState, eventId, actives, grumbo, characters){

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

exports.postresults.regen = function(message, character, battleState, eventId, actives, grumbo, characters){

	battleState.hpLoss -= Math.ceil(character.maxHP * 0.025);
}

exports.postresults.miracle = function(message, character, battleState, eventId, actives, grumbo, characters){

	var random = Math.random() * 100;
	if(random < character.res * 1.5){

		battleState.hpLoss -= Math.ceil(character.maxHP * 0.05);
		battleState.endMessages.push("Miracle reduced damage received!");
	}
}

exports.postresults.grab_bag = function(message, character, battleState, eventId, actives, grumbo, characters){

	var random = Math.random() * 100;
	if(random < 66 && battleState.state == statefunc.BATTLE && battleState.win){

		if(random < 33){

			battleState.exp += 10;
			battleState.endMessages.push("You pulled 10 experience out of the Grab Bag!");
		}
		else{

			character.gold += 25;
			battleState.endMessages.push("You pulled 25 gold out of the Grab Bag!");
		}
	}
}

exports.postresults.lifesteal = function(message, character, battleState, eventId, actives, grumbo, characters){

	var random = Math.random() * 100;
	if(random < 75){

		var stole = Math.ceil(character.pow * 0.015);
		battleState.hpLoss -= stole;
		battleState.endMessages.push("You lifestole for " + stole + " damage.");
	}
}

exports.postresults.barrier = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.multi_cast == null){

		battleState.multi_cast = {};
		battleState.multi_cast[character._id] = 0;
	}
	var random = Math.random() * 100;
	if(random < character.res*0.75){

		battleState.multi_cast[character._id] += 1;
		battleState.hpLoss -= Math.floor(character.wis/20);
		battleState.endMessages.push("Barrier reduced damage received!");
	}
}

exports.postresults.study = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.state == statefunc.BATTLE){

		var random = Math.random() * 100;
		if(random < 12){

			battleState.classExp += 1;
			battleState.endMessages.push("You studied for extra class experience!");
		}
	}
}

exports.postresults.grumbo_whistle = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(character.gold >= 94){

		character.gold -= 94;
		var random = Math.random() * 100;
		if(random < 50){

			battleState.hpLoss -= 5;
			battleState.endMessages.push("Grumbo came by and reduced damage recieved by 5!");
		}
		else{

			battleState.dmgMod += 20;
			if(battleState.state != statefunc.BATTLE){

				battleState.endMessages.push("Grumbo came by and dealt an additional 20 damage!");
			}
		}
	}
}

exports.postresults.safety_boots = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(character.hp < character.maxHP/2){

		battleState.hpLoss -= 2;
		battleState.endMessages.push("Your safety boots cut your damage by 2!");
	}
}

exports.postresults.adrenaline = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.adrenaline == null && character.hp <= character.maxHP * 0.1){

		battleState.adrenaline = true;
		battleState.hpLoss -= 20;
		battleState.endMessages.push("Adrenaline popped!");
		dbfunc.reduceDuration(character, [character.postresults], eventId, actives);
	}
}

exports.postresults.stimulus = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.stimulus == null && character.hp <= character.maxHP * 0.2){

		battleState.stimulus = true;
		battleState.dmgMod += 40;
		battleState.endMessages.push("Stimulus popped!");
		dbfunc.reduceDuration(character, [character.postresults], eventId, actives);
	}
}

exports.postresults.conceal = function(message, character, battleState, eventId, actives, grumbo, characters){

	var random = Math.random() * 100;
	if(random < character.spd){

		battleState.hpLoss -= 5;
		battleState.dmgMod += 10;
		battleState.endMessages.push("You revealed the concealed knife!");
	}
}

exports.postresults.roll = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.win){

		battleState.hpLoss -= Math.ceil(character.maxHP * 0.04);
		battleState.endMessages.push("You rolled!");
	}
}

exports.postresults.headshot = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.win){

		var random = Math.random() * 100;
		if(battleState.state == statefunc.BATTLE){

			if(random < character.skl/7){

				battleState.gold += Math.ceil(battleState.gold * 0.1);
				battleState.endMessages.push("You headshot the enemy!");
			}
		}
		else{

			if(random < character.skl/6){

				if(battleState.dmgMod > 0){

					battleState.dmgMod += Math.ceil(battleState.dmgMod * 0.5);
					battleState.endMessages.push("You headshot the enemy!");
				}
			}
		}
	}
}

//RAID Dumbo
exports.postresults.dumb_down = function(message, character, battleState, eventId, actives, grumbo, characters){

	for(var i = 0; i < actives.length; i++){

		if(actives[i].id == eventId){

			if(actives[i].duration <= 1){

				character.wisEq += 100;
				charfunc.calculateStats(character);
			}
			break;
		}
	}
	dbfunc.reduceDuration(character, [character.postresults], eventId, actives);
}

//RAID Grumboracle
exports.postresults.destiny = function(message, character, battleState, eventId, actives, grumbo, characters){

	for(var i = 0; i < actives.length; i++){

		if(actives[i].id == eventId){

			if(actives[i].duration <= 1){

				battleState.endMessages.push("Destiny calls...!");
				battleState.hpLoss += actives[i].value;
			}
			break;
		}
	}
	dbfunc.reduceDuration(character, [character.postresults], eventId, actives);
}

exports.postresults.heal = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.state == statefunc.RAID){

		var random = Math.random() * 100;
		if(random < character.res/3){

			var index = -1;
			var lowestPercent = 1;
			for(var i = 0; i < characters.length; i++){

				if(characters[i].hp > 0 && characters[i]._id != character._id){

					if(characters[i].hp/characters[i].maxHP < lowestPercent){

						lowestPercent = characters[i].hp/characters[i].maxHP;
						index = i;
					}
				}
			}
			if(index >= 0){

				var heal = Math.ceil(characters[index].maxHP * 0.15);
				var ally = characters[index];
				ally.hp += heal;
				if(ally.hp > ally.maxHP) ally.hp > ally.maxHP;
				characters[index] = ally;
				battleState.endMessages.push("You healed " + message.guild.members.get(characters[index]._id).displayName + " for " + heal + " HP!");
			}
		}
	}
}

exports.postresults.guardian = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.state == statefunc.RAID && (battleState[character._id] - 1) % 5 == 0){

		for(var i = 0; i < characters.length; i++){

			var ally = characters[i];
			if(ally.hp > 0 && ally._id != character._id){

				if(!ally.final.includes('defense_up')){

					active = activesList['defense_up'];
					active.value = Math.ceil(character.def * 0.08);
					ally.defEq += active.value;
					dbfunc.pushToState(ally, 'defense_up', active, active.battleStates, 1);
				}
				charfunc.calculateStats(ally);
				characters[i] = ally;
			}
		}
		battleState.endMessages.push("You casted Guardian!");
	}
}

exports.postresults.haste = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.state == statefunc.RAID){

		var random = Math.random() * 100;
		if(random < character.spd/3){

			//Choose a non dead character
			var randomTurn = Math.floor((Math.random() * characters.length) - 0.0001);
			var randomChar = characters[randomTurn];
			var dead = [];
			while(randomChar.hp <= 0 && dead.length < characters.length){

				if(!dead.includes(randomChar._id)) dead.push(randomChar._id);
				randomTurn = Math.floor((Math.random() * characters.length) - 0.0001);
				randomChar = characters[randomTurn];
			}
			if(dead.length < characters.length){

				battleState.turnValueMap[randomChar._id] += raidfunc.RAID_TURN_VALUE;
				battleState.endMessages.push("You hasted " + message.guild.members.get(randomChar._id).displayName + "!");
			}
		}
	}
}

exports.postresults.hourglass = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.state == statefunc.RAID){

		var random = Math.random() * 100;
		if(random < 12){

			battleState.turnValueMap[statefunc.RAID] -= Math.ceil(raidfunc.RAID_TURN_VALUE * 0.4);
			battleState.endMessages.push("The hourglass slowed the enemy!");
		}
	}
}

exports.postresults.chained = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.state != statefunc.BATTLE){

		var random = Math.random() * 100;
		if(random < 33){

			battleState.dmgMod += character.spd;
			if(battleState.state == statefunc.RAID){

				battleState.turnValueMap[character._id] -= Math.ceil(raidfunc.RAID_TURN_VALUE * 0.2);
				battleState.turnValueMap[statefunc.RAID] -= Math.ceil(raidfunc.RAID_TURN_VALUE * 0.2);
			}
			battleState.endMessages.push("You've chained the enemy!");
		}
	}
}

exports.postresults.warcry = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.state == statefunc.RAID && (battleState[character._id] - 1) % 5 == 0){

		for(var i = 0; i < characters.length; i++){

			var ally = characters[i];
			if(ally.hp > 0 && ally._id != character._id){

				if(!ally.final.includes('strength_up')){

					active = activesList['strength_up'];
					active.value = Math.ceil(character.pow * 0.07);
					ally.powEq += active.value;
					ally.wisEq += active.value;
					dbfunc.pushToState(ally, 'strength_up', active, active.battleStates, 1);
				}
				charfunc.calculateStats(ally);
				characters[i] = ally;
			}
		}
		battleState.endMessages.push("You shouted a warcry!");
	}
}

exports.postresults.mark = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.state == statefunc.RAID){

		var random = Math.random() * 100;
		if(random < character.skl/8){

			for(var i = 0; i < characters.length; i++){

				var ally = characters[i];
				if(ally.hp > 0 && ally._id != character._id){

					if(!ally.prebattle.includes('chance_up')){

						active = activesList['chance_up'];
						dbfunc.pushToState(ally, 'chance_up', active, active.battleStates, 1);
					}
					characters[i] = ally;
				}
			}
			battleState.endMessages.push("You marked the enemy!");
		}
	}
}

exports.postresults.rune_cast = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.state == statefunc.RAID && characters.length > 1){

		var random = Math.random() * 100;
		if(random < character.wis/10){

			//Choose a non dead ally
			var randomChoice = Math.floor((Math.random() * characters.length) - 0.0001);
			var ally = characters[randomChoice];
			var dead = [];
			while((ally.hp <= 0 && dead.length < characters.length) || ally._id == character._id){

				if(!dead.includes(ally._id)) dead.push(ally._id);
				randomChoice = Math.floor((Math.random() * characters.length) - 0.0001);
				ally = characters[randomChoice];
			}
			if(dead.length < characters.length){

				if(!ally.postresults.includes('blast_rune')){

					active = activesList['blast_rune'];
					dbfunc.pushToState(ally, 'blast_rune', active, active.battleStates, 1);
				}
				characters[randomChoice] = ally;
				battleState.endMessages.push("You cast a blast rune on " + message.guild.members.get(ally._id).displayName + "!");
			}
		}
	}
}

exports.postresults.blast_rune = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.dmgMod > 0){

		battleState.dmgMod = Math.ceil(battleState.dmgMod * 1.25);
	}
	battleState.endMessages.push("The blast rune exploded!");
	dbfunc.reduceDuration(character, [character.postresults], eventId, actives);
}

exports.postresults.bloody = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.state != statefunc.BATTLE){

		var random = Math.random() * 100;
		if(random < character.spd/2){

			battleState.dmgMod += Math.ceil(grumbo.hp * 0.01);
			battleState.endMessages.push("You made the enemy bleed!");
		}
	}
}

exports.postresults.profit = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.state == statefunc.RAID && battleState.profit == null){

		battleState.profit = true;
		grumbo.gold = Math.ceil(grumbo.gold * 1.4);
	}
}

exports.postresults.reflection = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.state == statefunc.RAID && battleState[character._id] % 2 == 0){

		var random = Math.random() * 100;
		if(random < character.res/6){

			for(var i = 0; i < characters.length; i++){

				var ally = characters[i];
				if(ally.hp > 0 && ally._id != character._id && ally.classId != 'cleric'){

					if(!ally.final.includes('reflect')){

						active = activesList['reflect'];
						dbfunc.pushToState(ally, 'reflect', active, active.battleStates, 1);
					}
					characters[i] = ally;
				}
			}
			battleState.endMessages.push("You casted Reflection!");
		}
	}
}

///////////////////////////////
// CHARACTER FINAL FUNCTIONS //
///////////////////////////////
exports.final.vision = function(message, character, battleState, eventId, actives, grumbo, characters){

	var random = Math.random() * 100;
	if(random < 12){

		battleState.hpLoss -= character.res;
		if(battleState.hpLoss < 0) battleState.hpLoss = 0;
		battleState.endMessages.push("Your vision helped you dodge significant damage!");
	}
}

exports.final.mantle = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.state == statefunc.BATTLE && battleState.win){

		if(battleState.exp < 10) battleState.exp = 10;
	}
}

exports.final.stand_your_ground = function(message, character, battleState, eventId, actives, grumbo, characters){

	var random = Math.random() * 100;
	if(random < character.def/8 && battleState.hpLoss >= character.maxHP * 0.16 && character.hp > 2){

		battleState.hpLoss = 0;
		battleState.endMessages.push("You stood your ground!");
	}
}

exports.final.safety_hat = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(character.hp < 50){

		battleState.hpLoss = Math.ceil(battleState.hpLoss*0.7);
		battleState.endMessages.push("Your safety hat cut your damage by 30%!");
	}
}

exports.final.dodge = function(message, character, battleState, eventId, actives, grumbo, characters){

	var random = Math.random() * 100;
	if(random < 8){

		battleState.hpLoss = 0;
		battleState.endMessages.push("You dodged all attacks!");
	}
}

exports.final.miracle = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.miracle == null){

		var random = Math.random() * 100;
		if(random < character.res * 1.5){

			if(battleState.hpLoss >= character.hp){

				battleState.miracle = true;
				battleState.hpLoss = character.hp - 1;
				battleState.endMessages.push("Miracle saved your life!");
			}
		}
	}
}

exports.final.guardian_angel = function(message, character, battleState, eventId, actives, grumbo, characters){

	var random = Math.random() * 100;
	if(random < 10){

		if(battleState.hpLoss >= character.hp){

			character.hp = character.res;
			battleState.hpLoss = 0;
			battleState.endMessages.push("You were saved by a Guardian Angel!");
		}
	}
}

exports.final.master_grumbos_protection = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.hpLoss >= character.hp){

		var random = Math.random() * 100;
		if(random < 20){

			battleState.hpLoss = 0;
			battleState.dmgMod = character.res;
			battleState.endMessages.push("Master Grumbo has given you another chance!");
		}
	}
}

exports.final.blessed = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.state == statefunc.BATTLE){

		var random = Math.random() * 100;
		if(random < 0.7){

			var randomArray = ['hp', 'pow', 'wis', 'skl', 'def', 'res', 'spd', 'luk', 'hp'];
			var random2 = Math.floor(Math.random() * (randomArray.length - 1));
			var stat = randomArray[random2];
			var statMod = stat + "Mod";
			character[statMod] += 1;
			charfunc.calculateStats(character);
			battleState.endMessages.push("You were blessed with a permanent +1 boost to " + stat.toUpperCase() + "!");
		}
	}
}

exports.final.for_honor = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(character.hp <= 2){

		battleState.hpLoss = 1;
		battleState.endMessages.push("For Honor!");
	}
	else if(character.hp - battleState.hpLoss <= 2 && battleState.for_honor == null){

		battleState.for_honor = true;
		battleState.hpLoss = character.hp - 2;
		battleState.endMessages.push("For Honor!");
	}
}

exports.final.defense_up = function(message, character, battleState, eventId, actives, grumbo, characters){

	for(var i = 0; i < actives.length; i++){

		if(actives[i].id == eventId){

			if(actives[i].duration <= 1){

				character.defEq -= actives[i].value;
				charfunc.calculateStats(character);
			}
			break;
		}
	}
	dbfunc.reduceDuration(character, [character.final], eventId, actives);
}

exports.final.strength_up = function(message, character, battleState, eventId, actives, grumbo, characters){

	for(var i = 0; i < actives.length; i++){

		if(actives[i].id == eventId){

			if(actives[i].duration <= 1){

				character.powEq -= actives[i].value;
				character.wisEq -= actives[i].value;
				charfunc.calculateStats(character);
			}
			break;
		}
	}
	dbfunc.reduceDuration(character, [character.final], eventId, actives);
}

exports.final.reflect = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.hpLoss > 0){

		battleState.dmgMod += battleState.hpLoss;
		battleState.hpLoss = 0;
	}
	battleState.endMessages.push("You reflected the damage!");
	dbfunc.reduceDuration(character, [character.final], eventId, actives);
}

exports.final.multi_cast = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.multi_cast == null){

		battleState.multi_cast = {};
		battleState.multi_cast[character._id] = 0;
	}
	if(battleState.multi_cast[character._id] > 0 && battleState.dmgMod > 0){

		battleState.dmgMod += Math.ceil(battleState.dmgMod * (battleState.multi_cast[character._id] / 10));
		battleState.endMessages.push("You consumed " + battleState.multi_cast[character._id] + " multi cast stacks!");
		battleState.multi_cast[character._id] = 0;
	}
}

exports.final.rampage = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.dmgMod > 0){

		battleState.dmgMod += Math.ceil(battleState.dmgMod * (battleState.rampage[character._id] / 100));
	}
	battleState.endMessages.push("You're rampaging with " + battleState.rampage[character._id] + " stacks!");
}

exports.final.pierce = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.state != statefunc.BATTLE){

		var random = Math.random() * 100;
		if(random < character.skl/10){

			battleState.dmgMod += Math.ceil(character.pow/5);
			battleState.endMessages.push("You pierced the enemy!");
		}
	}
}

exports.final.demonblade = function(message, character, battleState, eventId, actives, grumbo, characters){

	var random = Math.random() * 100;
	if(random < character.skl/11 && battleState.hpLoss > 0){

		battleState.hpLoss = 0;
		battleState.endMessages.push("You are one with the Demonblade!");
	}
}

exports.final.freebie = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.state == statefunc.BATTLE){

		var random = Math.random() * 100;
		if(random < 10){

			character.battlesLeft += 1;
			battleState.endMessages.push("Here's a Freebie!");
		}
	}
}
