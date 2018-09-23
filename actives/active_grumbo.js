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
exports.prebattle.wumbo = function(character, battleState, eventId, actives, grumbo){

	battleState.maxMod -= 25;
}

//BOSS Venom Grumbo
exports.prebattle.venom = function(character, battleState, eventId, actives, grumbo){

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
exports.prebattle.red_eye = function(character, battleState, eventId, actives, grumbo){

	if(battleState.phase == 1){

		if((!character.items.includes('feather_stone') || !character.items.includes('battle_potion')) && !character.postresults.includes('iron_pendant')){

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
exports.prebattle.show_me_your_mixtape = function(character, battleState, eventId, actives, grumbo){

		if(actives.length < 12 - battleState.phase){

			battleState.chanceMod -= 64;
			battleState.dmgMod -= 64;
			battleState.preMessages.push("Mixtape Grumbo was unimpressed by your mixtape!");
		}
}

/////////////////////////////////
// GRUMBO PRERESULTS FUNCTIONS //
/////////////////////////////////

//////////////////////////////////
// GRUMBO POSTRESULTS FUNCTIONS //
//////////////////////////////////
exports.postresults.poison = function(character, battleState, eventId, actives, grumbo){

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

exports.postresults.pilfer = function(character, battleState, eventId, actives, grumbo){

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

exports.postresults.gold_boost_1 = function(character, battleState, eventId, actives, grumbo){

	if(battleState.win){

		var gainGold = Math.floor(Math.random() * (75 - 20 + 1)) + 25;
		character.gold += gainGold;
		battleState.endMessages.push(gainGold + " extra gold was gained!");
	}
}

exports.postresults.assassinate = function(character, battleState, eventId, actives, grumbo){

	if(!battleState.win && !battleState.noDmgTaken){

		character.battlesLeft -= character.battlesLeft - 1;
		battleState.hpLoss += charfunc.MAX_HP;
		battleState.endMessages.push("The Grumbassassin performed a swift grumbassassination!");
	}
}

exports.postresults.fear = function(character, battleState, eventId, actives, grumbo){

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

exports.postresults.permaboost = function(character, battleState, eventId, actives, grumbo){

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

exports.postresults.brojob = function(character, battleState, eventId, actives, grumbo){

		character.gold += 20;
		battleState.hpLoss = -20;
		battleState.endMessages.push("Bro gave you pocket change of 20 gold!");
}

exports.postresults.bleed = function(character, battleState, eventId, actives, grumbo){

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

exports.postresults.petrify = function(character, battleState, eventId, actives, grumbo){

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

			character.defEq += 50;
			character.powEq -= 100;
			active = activesList[eventId];
			dbfunc.pushToState(character, eventId, active, active.battleStates, 1);
		}
		charfunc.calculateStats(character);
		battleState.endMessages.push("You've been petrified!");
	}
}

exports.postresults.root = function(character, battleState, eventId, actives, grumbo){

	if(!battleState.win && character.classId != "rogue"){

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

//BOSS Venom Grumbo
exports.postresults.venom_bite = function(character, battleState, eventId, actives, grumbo){

	battleState.hpLoss += 3 + Math.floor((Math.random() * 4) - 2);
	if(character.prebattle.includes('poison')){

		var active;
		battleState.hpLoss = battleState.hpLoss * 5;
		battleState.endMessages.push("Venom Bite deals significantly more damage to Poison victims!");
	}
}

//BOSS Venom Grumbo
exports.postresults.equalizer = function(character, battleState, eventId, actives, grumbo){

	if(battleState.bossHp < 120 && battleState.equalized == null){

		battleState.equalized = true;
		if(character.res < 8 || character.pow < 85 || character.wis < 85){

			battleState.hpLoss += Math.abs(character.pow - character.wis);
			battleState.endMessages.push("Venom Grumbo has panicked and used the Equalizer active!");
		}
		else{

			battleState.endMessages.push("Venom Grumbo's Equalizer was ineffective!");
		}
	}
}

//BOSS Crimson Grumbo
exports.postresults.rock_smash = function(character, battleState, eventId, actives, grumbo){

	var damage = 5 + Math.floor((Math.random() * 6) - 3);
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
exports.postresults.crimson_blood = function(character, battleState, eventId, actives, grumbo){

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
exports.postresults.disco_inferno = function(character, battleState, eventId, actives, grumbo){

	battleState.hpLoss += 6;
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
exports.postresults.final_track = function(character, battleState, eventId, actives, grumbo){

	if(battleState.phase >= 8){

		battleState.hpLoss += 416;
		battleState.endMessages.push("Mixtape Grumbo dropped his hottest diss track!");
	}
}

//BOSS Master Grumbo
exports.postresults.strategize = function(character, battleState, eventId, actives, grumbo){

		if(battleState.chanceMod < 6){

			battleState.dmgMod -= 100;
			battleState.preMessages.push("You were out strategized!");
		}
}

//BOSS Master Grumbo
exports.postresults.gate_of_grumbo = function(character, battleState, eventId, actives, grumbo){

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
exports.postresults.evaluation = function(character, battleState, eventId, actives, grumbo){

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
exports.postresults.teaching = function(character, battleState, eventId, actives, grumbo){

	battleState.hpLoss += 10 - Math.floor(Math.random() * character.spd);
}
