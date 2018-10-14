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

////////////////////////////////
// GRUMBO PREBATTLE FUNCTIONS //
////////////////////////////////
exports.prebattle.wumbo = function(message, character, battleState, eventId, actives, grumbo, characters){

	battleState.maxMod -= 25;
}

//BOSS Venom Grumbo
exports.prebattle.venom = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(!character.postresults.includes('poison_charm')){

		if(!character.items.includes('antidote')){

			var active;
			if(character.prebattle.includes('poison')){

				for(var i = 0; i < actives.length; i++){

					if(actives[i].id == 'poison'){

						active = actives[i];
						active.duration += activesList['poison'].duration;
						if(active.duration > 10) active.duration = 10;
						dbfunc.updateActive(active);
						break;
					}
				}
			}
			else{

				active = activesList['poison'];
				dbfunc.pushToState(character, 'poison', active, active.battleStates, 1);
			}
			battleState.preMessages.push("Venom Grumbo has inflicted Poison on you!");
		}
		else{

			var index = character.items.indexOf('antidote');
			character.items.splice(index, 1);
			battleState.preMessages.push("You avoided Venom Grumbo's Poison but it destroyed one of your antidotes!");
		}
	}
	else{

		battleState.preMessages.push("Poison Charm protects you from Venom Grumbo's Poison.");
	}
}

//BOSS Crimson Grumbo
exports.prebattle.red_eye = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.phase == 1){

		if((!character.items.includes('feather_stone') || !character.items.includes('battle_potion')) && !character.postresults.includes('iron_pendant') && character.head != "feather_hat"){

			var active;
			if(character.postresults.includes('petrify')){

				for(var i = 0; i < actives.length; i++){

					if(actives[i].id == 'petrify'){

						active = actives[i];
						active.duration += activesList['petrify'].duration;
						if(active.duration > 10) active.duration = 10;
						dbfunc.updateActive(active);
						break;
					}
				}
			}
			else{

				character.defEq += 50;
				character.powEq -= 100;
				active = activesList['petrify'];
				dbfunc.pushToState(character, 'petrify', active, active.battleStates, 1);
			}
			charfunc.calculateStats(character);
			battleState.preMessages.push("You were petrified by Crimson Grumbo's Red Eye!");
		}
		else{

			battleState.preMessages.push("Your were protected from Crimson Grumbo's Red Eye!");
		}
	}
}

//BOSS Mixtape Grumbo
exports.prebattle.show_me_your_mixtape = function(message, character, battleState, eventId, actives, grumbo, characters){

		if(actives.length < 11 - battleState.phase){

			battleState.chanceMod -= 64;
			battleState.dmgMod -= 64;
			battleState.preMessages.push("Mixtape Grumbo was unimpressed by your mixtape!");
		}
}

//BOSS Demonblade Grumbo
exports.prebattle.unleash = function(message, character, battleState, eventId, actives, grumbo, characters){

		if(battleState.unleash == null && grumbo.hp < 420){

			battleState.unleash = true;
			grumbo.skl += 40;
			grumbo.name = "Unleashed Demonblade";
			battleState.preMessages.push("The Demonblade is Unleashed!");
		}
}

//RAID Ninja Grumbo
exports.prebattle.smokescreen = function(message, character, battleState, eventId, actives, grumbo, characters){

		if(battleState.turn_state == statefunc.CHARACTER){

			var diff = grumbo.spd - character.spd;
			var random = Math.random() * 100;
			if(random < diff){

				battleState.chanceMod -= 100;
				battleState.preMessages.push("Ninja Grumbo smokescreened!");
			}
		}
}

/////////////////////////////////
// GRUMBO PRERESULTS FUNCTIONS //
/////////////////////////////////
//BOSS Venom Grumbo regular attack
exports.preresults.venom_bite = function(message, character, battleState, eventId, actives, grumbo, characters){

	var dmg = Math.floor((grumbo.pow - character.def)/2.2) + 3;
	if(dmg < 3) dmg = 3;
	battleState.hpLoss = dmg;
}

//BOSS Mixtape Grumbo regular attack
exports.preresults.disco_inferno = function(message, character, battleState, eventId, actives, grumbo, characters){

	var dmg = Math.floor((grumbo.pow - character.def)/2.2) + 3;
	if(dmg < 3) dmg = 3;
	battleState.hpLoss = dmg;
}

//BOSS Crimson Grumbo regular attack
exports.preresults.rock_smash = function(message, character, battleState, eventId, actives, grumbo, characters){

	var dmg = Math.floor((grumbo.pow - character.def)/2.2) + 3;
	if(dmg < 3) dmg = 3;
	battleState.hpLoss = dmg;
}

//BOSS Master Grumbo regular attack
exports.preresults.teaching = function(message, character, battleState, eventId, actives, grumbo, characters){

	var dmg = Math.floor((grumbo.pow - character.def)/2.2) + 3;
	if(dmg < 3) dmg = 3;
	battleState.hpLoss = dmg;
}

//BOSS Demonblade Grumbo regular attack
exports.preresults.slice = function(message, character, battleState, eventId, actives, grumbo, characters){

	var dmg = Math.floor((grumbo.pow - character.def)/2.75) + 5 + Math.floor((Math.random() * 4) - 2);
	if(dmg < 10) dmg = 10;
	battleState.hpLoss = dmg;
}

//RAID Dumbo
exports.preresults.wallop = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.turn_state == statefunc.BOSS){

		var random = Math.random() * 100;
		if(random > character.spd*0.8){

			var dmg = Math.floor(grumbo.pow - character.def) + Math.floor((Math.random() * 4) - 2) + 10;
			if(dmg < 10) dmg = 10;
			battleState.hpLoss = dmg;
			battleState.preResMessages.push("You were walloped!");
		}
		else{

			battleState.preResMessages.push("Dumbo missed!");
		}
	}
}

//RAID Dumbo
exports.preresults.i_am_smart = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(grumbo.wis > character.wis){

		battleState.dmgMod -= grumbo.wis - character.wis;
		battleState.preResMessages.push("Dumbo is smart!");
	}
}

//RAID Grumboracle
exports.preresults.judgment = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.turn_state == statefunc.BOSS){

		var random = Math.random() * 100;
		//Judge by DEF
		if(random < 50){

			var dmg = Math.floor((grumbo.wis - character.def)/5) + Math.floor((Math.random() * 2) - 1);
			if(dmg < 10) dmg = 10;
			battleState.hpLoss = dmg;
			battleState.preResMessages.push("You DEF has been judged!");
		}
		//Judge by RES
		else{

			var dmg = Math.floor((grumbo.pow - character.res)/4) + Math.floor((Math.random() * 2) - 1);
			if(dmg < 10) dmg = 10;
			battleState.hpLoss = dmg;
			battleState.preResMessages.push("Your RES has been judged!");
		}

		if(battleState.judgment == 0){

			battleState.judgment += 1;
			battleState.turnValueMap[statefunc.RAID] += raidfunc.RAID_TURN_VALUE;
		}
		else{

			battleState.judgment = 0;
			if(battleState.hpLoss > 0){

				battleState.hpLoss = Math.ceil(battleState.hpLoss/2);
			}
		}
	}
}

//RAID Ninja Grumbo
exports.preresults.shuriken = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.turn_state == statefunc.BOSS){

		battleState.shuriken = character._id;
		var dmg = Math.floor((grumbo.pow - character.def)/1.5) + 5 + Math.floor((Math.random() * 4) - 2);
		if(dmg < 15) dmg = 15;
		battleState.hpLoss = dmg;
		if(!character.postresults.includes('iron_pendant')){

			var active;
			if(character.postresults.includes('bleed')){

				for(var i = 0; i < actives.length; i++){

					if(actives[i].id == 'bleed'){

						active = actives[i];
						active.duration += activesList['bleed'].duration;
						if(active.duration > 10) active.duration = 10;
						dbfunc.updateActive(active);
						break;
					}
				}
			}
			else{

				character.resEq -= 5;
				character.defEq -= 5;
				active = activesList['bleed'];
				dbfunc.pushToState(character, 'bleed', active, active.battleStates, 1);
			}
			charfunc.calculateStats(character);
			battleState.preResMessages.push("You've started bleeding!");
		}
	}
}

//////////////////////////////////
// GRUMBO POSTRESULTS FUNCTIONS //
//////////////////////////////////
exports.postresults.poison = function(message, character, battleState, eventId, actives, grumbo, characters){

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

exports.postresults.pilfer = function(message, character, battleState, eventId, actives, grumbo, characters){

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

exports.postresults.gold_boost_1 = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.win){

		var gainGold = Math.floor(Math.random() * (75 - 20 + 1)) + 25;
		character.gold += gainGold;
		battleState.endMessages.push(gainGold + " extra gold was gained!");
	}
}

exports.postresults.assassinate = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(!battleState.win){

		character.battlesLeft -= character.battlesLeft - 1;
		battleState.hpLoss += character.maxHP;
		battleState.endMessages.push("The Grumbassassin performed a swift grumbassassination!");
	}
}

exports.postresults.fear = function(message, character, battleState, eventId, actives, grumbo, characters){

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

exports.postresults.permaboost = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.win){

		var randomArray = ['hp', 'pow', 'wis', 'skl', 'def', 'res', 'spd', 'luk', 'hp'];
		var random = Math.floor(Math.random() * (randomArray.length - 1));
		var stat = randomArray[random];
		var statMod = stat + "Mod";
		character[statMod] += 1;
		charfunc.calculateStats(character);
		battleState.endMessages.push("You gained a permanent +1 boost to " + stat.toUpperCase());
	}
}

exports.postresults.brojob = function(message, character, battleState, eventId, actives, grumbo, characters){

		character.gold += 20;
		battleState.hpLoss = -20;
		battleState.endMessages.push("Bro gave you pocket change of 20 gold!");
}

exports.postresults.bleed = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(!battleState.win && !character.postresults.includes('iron_pendant')){

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

exports.postresults.paralyze = function(message, character, battleState, eventId, actives, grumbo, characters){

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

			active = activesList[eventId];
			active.value = character.res;
			character.resEq -= character.res;
			dbfunc.pushToState(character, eventId, active, active.battleStates, 1);
		}
		charfunc.calculateStats(character);
		battleState.endMessages.push("You've been paralyzed!");
	}
}

exports.postresults.curse = function(message, character, battleState, eventId, actives, grumbo, characters){

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

			active = activesList[eventId];
			active.value = Math.ceil(character.maxHP/2);
			character.hpEq -= active.value;
			dbfunc.pushToState(character, eventId, active, active.battleStates, 1);
		}
		charfunc.calculateStats(character);
		battleState.endMessages.push("You've been cursed!");
	}
}

exports.postresults.petrify = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(!battleState.win && !character.postresults.includes('iron_pendant') && character.head != "feather_hat"){

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

//RAID Dumbo
exports.postresults.dumb_down = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.turn_state == statefunc.BOSS){

		var active;
		battleState.hpLoss += 12;
		var random = Math.random() * 100;
		if(random > character.res){

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

				character.wisEq -= 100;
				active = activesList[eventId];
				dbfunc.pushToState(character, eventId, active, active.battleStates, 1);
			}
			charfunc.calculateStats(character);
			battleState.endMessages.push("Uh oh! You're dumb!");
		}
		else{

			battleState.endMessages.push("You were too smart to be dumbed down!");
		}
	}
}

//RAID Grumboracle
exports.postresults.destiny = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.turn_state == statefunc.BOSS){

		var active;
		var random = Math.random() * 100;
		if(random > character.res){

			if(!character.postresults.includes(eventId)){

				active = activesList[eventId];
				active.value = battleState.highestRes;
				dbfunc.pushToState(character, eventId, active, active.battleStates, 1);
				battleState.endMessages.push("Grumboracle has foretold your Destiny!");
			}
			else{

				battleState.endMessages.push("Your Destiny has already been foretold...");
			}
		}
		else{

			battleState.endMessages.push("You denied your Destiny!");
		}
	}
}

//RAID Grumboracle
exports.postresults.seek_the_truth = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.turn_state == statefunc.BOSS){

		//First turn using seek the truth
		if(battleState.seek_the_truth == 1){

			battleState.hpLoss += 20;
			battleState.turnValueMap[statefunc.RAID] -= raidfunc.RAID_TURN_VALUE;
			battleState.endMessages.push("Grumboracle has begun seeking the truth!");
		}
		//Heal or deal damage
		else{

			//Damage
			if(battleState.seek_the_truth_dmg < 1600){

				battleState.hpLoss += Math.ceil(battleState.highestWis/8);
				battleState.endMessages.push("Grumboracle was angered by the truth!");
			}
			//Heal
			else{

				battleState.hpLoss -= Math.ceil(battleState.highestWis/20);
				battleState.endMessages.push("Grumboracle was guided to the truth!");
			}
		}
	}
	else{

		if(battleState.seek_the_truth == 1){

			if(battleState.seek_the_truth_dmg == null) battleState.seek_the_truth_dmg = 0;
			battleState.seek_the_truth_dmg += battleState.dmgMod;
			battleState.dmgMod = 0;
			battleState.endMessages.push("Grumboracle has negated " + battleState.seek_the_truth_dmg + " damage while seeking the truth");
		}
	}
}

//RAID Ninja Grumbo
exports.postresults.shadow_step = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.turn_state == statefunc.BOSS){

		battleState.shadow_step = character._id;
		var dmg = grumbo.spd - character.spd + 10 + Math.floor((Math.random() * 4) - 2) + 5;
		if(dmg < 15) dmg = 15;
		battleState.hpLoss += dmg;
		battleState.turnValueMap[statefunc.RAID] += raidfunc.RAID_TURN_VALUE/2;
	}
	else{

		if(battleState.shadow_step != null && battleState.shadow_step == character._id){

			battleState.dmgMod = 0;
			battleState.endMessages.push("Ninja Grumbo shadow stepped your damage!");
			battleState.shadow_step = null; //Reset
		}
	}
}

//RAID Ninja Grumbo
exports.postresults.shock_trap = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.turn_state == statefunc.BOSS){

		var active;
		battleState.hpLoss += 15;
		var random = Math.random() * 100;
		if(random > character.res){

			var random2 = Math.random() * 100;
			if(random2 > character.spd){

				if(!character.items.includes("shock_tablet")){

					if(character.postresults.includes("paralyze")){

						for(var i = 0; i < actives.length; i++){

							if(actives[i].id == "paralyze"){

								active = actives[i];
								active.duration += activesList["paralyze"].duration;
								if(active.duration > 10) active.duration = 10;
								dbfunc.updateActive(active);
								break;
							}
						}
					}
					else{

						active = activesList["paralyze"];
						active.value = character.res;
						character.resEq -= character.res;
						dbfunc.pushToState(character, "paralyze", active, active.battleStates, 1);
					}
					charfunc.calculateStats(character);
					battleState.endMessages.push("You've been paralyzed!");
				}
				else{

					var shockMessage = "You consumed a shock tablet to avoid the Paralyze!";
					var random3 = Math.random() * 100;
					if(random3 < 20){

						shockMessage = "You avoided the Paralyze without using a Shock Tablet!";
					}
					else{

						var index = character.items.indexOf('shock_tablet');
						character.items.splice(index, 1);
					}
					battleState.endMessages.push(shockMessage);
				}
			}
			else{

				battleState.endMessages.push("You dodged the shock trap!");
			}
		}
		else{

			battleState.endMessages.push("You resisted the shock trap!");
		}
	}
}

//RAID Grumboracle
exports.postresults.doom = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.turn_state == statefunc.BOSS){

		var active;
		if(character.postresults.includes('curse')){

			for(var i = 0; i < actives.length; i++){

				if(actives[i].id == 'curse'){

					active = actives[i];
					active.duration += activesList['curse'].duration;
					if(active.duration > 10) active.duration = 10;
					dbfunc.updateActive(active);
					break;
				}
			}
		}
		else{

			active = activesList['curse'];
			active.value = Math.ceil(character.maxHP/2);
			character.hpEq -= active.value;
			dbfunc.pushToState(character, 'curse', active, active.battleStates, 1);
		}
		charfunc.calculateStats(character);
		battleState.endMessages.push("You've been cursed!");
		battleState.turnValueMap[statefunc.RAID] += raidfunc.RAID_TURN_VALUE;
	}
}

exports.postresults.root = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(!battleState.win && character.classId != "rogue" && character.weapon != "machete"){

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

			character.spdEq -= 10;
			active = activesList[eventId];
			dbfunc.pushToState(character, eventId, active, active.battleStates, 1);
		}
		charfunc.calculateStats(character);
		battleState.endMessages.push("You've been rooted!");
	}
}

exports.postresults.blind = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(!battleState.win && !character.postresults.includes('sunglasses')){

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

			character.sklEq -= 30;
			active = activesList[eventId];
			dbfunc.pushToState(character, eventId, active, active.battleStates, 1);
		}
		charfunc.calculateStats(character);
		battleState.endMessages.push("You've been blinded!");
	}
}

//BOSS Venom Grumbo
exports.postresults.venom_bite = function(message, character, battleState, eventId, actives, grumbo, characters){

	battleState.hpLoss += 6 + Math.floor((Math.random() * 4) - 2);
	if(character.prebattle.includes('poison')){

		var active;
		battleState.hpLoss = battleState.hpLoss * 5;
		battleState.endMessages.push("Venom Bite deals significantly more damage to Poison victims!");
	}
}

//BOSS Venom Grumbo
exports.postresults.equalizer = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(grumbo.hp < 120 && battleState.equalized == null){

		battleState.equalized = true;
		if(character.res < 7 || character.pow < 82 || character.wis < 82){

			battleState.hpLoss += Math.abs(character.pow - character.wis);
			battleState.endMessages.push("Venom Grumbo has panicked and used the Equalizer active!");
		}
		else{

			battleState.endMessages.push("Venom Grumbo's Equalizer was ineffective!");
		}
	}
}

//BOSS Crimson Grumbo
exports.postresults.rock_smash = function(message, character, battleState, eventId, actives, grumbo, characters){

	var damage = 12 + Math.floor((Math.random() * 6) - 3);
	if(battleState.phase == 1){

		damage = Math.ceil(character.def/10);
		if(character.postresults.includes('petrify')){

			var active;
			damage = 100;
			battleState.endMessages.push("Crimson Grumbo smashed you to pieces!");
		}
	}
	battleState.hpLoss += damage;
}

//BOSS Crimson Grumbo
exports.postresults.crimson_blood = function(message, character, battleState, eventId, actives, grumbo, characters){

	if((battleState.phase - 2) % 4 == 0){

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

			active = activesList[eventId];
			dbfunc.pushToState(character, eventId, active, active.battleStates, 1);
		}
		battleState.endMessages.push("You've been injected with Crimson Blood!");
	}
}

//BOSS Mixtape Grumbo
exports.postresults.disco_inferno = function(message, character, battleState, eventId, actives, grumbo, characters){

	battleState.hpLoss += 7;
	if(battleState.phase >= 4){

		battleState.endMessages.push("Disco Inferno is rolling!");
		var wisDiff = grumbo.wis - character.wis;
		if(wisDiff < 0) wisDiff = 0;
		battleState.dmgMod -= wisDiff;
		if(wisDiff > 0){

			var random = Math.random() * 100;
			if(random < wisDiff){

				battleState.hpLoss += 60;
				battleState.endMessages.push("Disco Inferno baby!");
			}
		}
	}
}

//BOSS Mixtape Grumbo
exports.postresults.final_track = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.phase >= 8){

		battleState.hpLoss += 416;
		battleState.endMessages.push("Mixtape Grumbo dropped his hottest diss track!");
	}
}

//BOSS Master Grumbo
exports.postresults.strategize = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.chanceMod < 7){

		battleState.dmgMod -= 100;
		battleState.endMessages.push("You were out strategized!");
	}
}

//BOSS Master Grumbo
exports.postresults.gate_of_grumbo = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.phase % 5 == 0 && battleState.phase != 0){

		var random = Math.random() * 100;
		if(random < (character.spd + character.luk)*2){

			battleState.hpLoss -= 50;
			battleState.endMessages.push("You opened the Gate of Grumbo!");
		}
		else{

			battleState.dmgMod -= 150;
			battleState.endMessages.push("You were rejected by the Gate of Grumbo!");
		}
	}
}

//BOSS Master Grumbo
exports.postresults.evaluation = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(battleState.phase % 4 == 0 && battleState.phase != 0){

		var diff = Math.abs(character.pow - character.wis);
		if(diff < 45){

			battleState.hpLoss += 45;
			battleState.endMessages.push("You failed the evaluation!");
		}
		else{

			var random = Math.random() * 100;
			if(random < diff){

				battleState.hpLoss -= 15;
				battleState.endMessages.push("You passed the evaluation!");
			}
		}
	}
}

//BOSS Master Grumbo
exports.postresults.teaching = function(message, character, battleState, eventId, actives, grumbo, characters){

	battleState.hpLoss += 25 - Math.floor(Math.random() * character.spd);
}

//BOSS Master Grumbo
exports.postresults.mastercraft = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(character.classLevel < 6 && battleState.hpLoss > 0){

		battleState.hpLoss += battleState.hpLoss;
		battleState.endMessages.push("You need to hone your craft more!");
	}
}

//BOSS Demonblade Grumbo
exports.postresults.one_with_the_blade = function(message, character, battleState, eventId, actives, grumbo, characters){

	if(character.skl < grumbo.skl){

		var diff = grumbo.skl - character.skl;
		var random = Math.random() * 100;
		if(random < diff/1.5 && battleState.dmgMod > 0){

			battleState.dmgMod = 0;
			battleState.endMessages.push("One with the Demonblade!");
		}
	}
}

//BOSS Demonblade Grumbo
exports.postresults.siphon = function(message, character, battleState, eventId, actives, grumbo, characters){

	var diff = 100 - character.res;
	var random = Math.random() * 100;
	if(random < diff/1.5 && battleState.hpLoss > 0){

		battleState.dmgMod -= battleState.hpLoss;
		grumbo.pow += Math.ceil(battleState.hpLoss/8);
		battleState.endMessages.push("The Demonblade siphons power!");
	}
}
