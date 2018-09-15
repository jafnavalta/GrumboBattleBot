//Initialize DB functions
let dbfunc = require('../data/db.js');

//Initialize fs
const fs = require("fs");

//Initialize functions
let state = require('../state.js');
let charfunc = require('../character/character.js');
let classfunc = require('../character/class.js');

//Initialize list files
let grumboList = JSON.parse(fs.readFileSync("./values/grumbos.json", "utf8"));
let classList = JSON.parse(fs.readFileSync("./values/classes.json", "utf8"));


//Weighted Arrays for randomly choosing Grumbos
let weighedGrumbos = [];

/**
* Fill the weighted arrays.
*/
exports.initWeighedArrays = function(){

	for(var key in grumboList){

		var grumbo = grumboList[key];
		for(var i = 0; i < grumbo.weight; i++){

			weighedGrumbos.push(grumbo.id);
		}
	};
}

/**
* Battle command
*/
exports.commandBattle = function(message, args, character){

	if(args.length == 4 && isInteger(args[3])){

		if(args[2] == 'level'){

			//Determine how many battles they should have left
			var date = new Date();
			var currentTime = date.getTime();
			exports.restockBattles(currentTime, character);

			//Character is already in a battle
			if(character.battleLock){

				message.channel.send("You are already in battle " + message.member.displayName + "!");
			}
			//User tried to fight a Grumbo who has a level lower than 1
			else if(args[3] < 1){

				//Can't fight negative or 0 level Grumbos
				message.channel.send("Bruh, you can't choose a level less than 1 you scrub");
			}
			//User tried to fight Grumbo that was over 20 levels higher than them
			else if((character.level - args[3]) < -20){

				//Can't fight a Grumbo who is over 20 levels higher than you
				var maxLevel = character.level + 20;
				message.channel.send("Pick a fight up to 20 levels higher than your own level you fool\nYour current limit is Grumbo Lv" + maxLevel);
			}
			//No battles left
			else if(character.battlesLeft <= 0){

				var timeUntilNextBattleInMinutes = Math.ceil((character.battletime + charfunc.calculateWaitTime(character) - currentTime)/60000);
				message.channel.send("You don't have any battles left. You get a battle chance every 1 hour up (reduced by SPD) to a maximum stock of 5 battles. You can battle again in "
					+ timeUntilNextBattleInMinutes + " minutes");
			}
			//BATTLE
			else{

				//Get all character active effects
				dbfunc.getDB().collection("actives").find({"character": character._id}).toArray(function(err, actives){

					doBattle(message, args, character, currentTime, actives);
				});
			}
		}
		else{

			message.channel.send("Bad battle command. Try '!grumbo help' for the correct command.");
		}
	}
	else{

		message.channel.send("Bad battle command. Try '!grumbo help' for the correct command.");
	}
}

/**
* Adds battle attempts to character if possible.
*/
exports.restockBattles = function(currentTime, character){

	var timeSinceLastBattle = currentTime - character.battletime;
	var addBattles = Math.floor(timeSinceLastBattle/charfunc.calculateWaitTime(character));
	if(addBattles > 0){

		character.battlesLeft += addBattles;
		if(character.battlesLeft < 5){

			character.battletime = character.battletime + (addBattles * charfunc.calculateWaitTime(character));
		}
		if(character.battlesLeft >= 5){

			character.battlesLeft = 5;
		}
	}

	dbfunc.updateCharacter(character);
}

/**
* Do battle
*/
function doBattle(message, args, character, currentTime, actives){

	//Don't allow user to battle multiple times at once
	character.battleLock = true;
	dbfunc.getDB().collection("characters").updateOne(
			{"_id": character._id},
			{$set: {"battleLock": character.battleLock}},
		function(error, result){

		//Prebattle determinations
		var grumbo = getRandomGrumbo(args[3]);
		var battleState = {};
		battleState.isBoss = false;
		battleState.enemyLevel = args[3];
		state.prebattle(message, args, character, battleState, actives, grumbo);

		if(character.battlesLeft == 5){

			character.battletime = currentTime;
		}

		var username = message.member.displayName;
		var preMessageString = username + " Lv" + character.level + "   VS   " + grumbo.name + " Lv" + args[3] + "\n"
			+ "POW   " + character.pow + "   |   " + grumbo.pow + "\n"
			+ "WIS    " + character.wis + "   |   " + grumbo.wis + "\n";
		battleState.preMessages.forEach(function(preMessage){

			preMessageString += preMessage + "\n";
		});
		preMessageString += username + " has a " + battleState.chance + "% chance of victory\n"
			+ "Battle in progress, please wait a moment...\n";
		message.channel.send(preMessageString);

		//Wait 5 seconds before determining/displaying battle results
		setTimeout(function(){

			//Determine battle results
			battleState.result = Math.floor(Math.random() * (101));

			//Preresults determinations
			state.preresults(message, character, battleState, actives, grumbo);

			//If victory
			var endMessageString = "";
			if(battleState.win){

				//Postresults determinations
				state.postresults(message, character, battleState, actives, grumbo);

				//Calculate postresults variables
				var leftover = (battleState.exp + character.experience) % 100;
				battleState.gains = Math.floor(((battleState.exp + character.experience)/100));

				//Win message and results
				character.battlesLeft -= 1;
				character.wins += 1;
				charfunc.levelChange(character, battleState.gains);
				character.experience = leftover;
				character.gold = Math.floor(character.gold + battleState.gold);
				character.winrate = Math.floor(((character.wins / (character.wins + character.losses)) * 100));

				endMessageString += grumbo.victory.replace('$name', username) + "\n";
				battleState.preResMessages.forEach(function(preResMessage){

					endMessageString += preResMessage + "\n";
				});
				endMessageString += "You gained " + battleState.exp + " experience and " + battleState.gold + " gold!\n";
				if(battleState.hpLoss >= 0){

					endMessageString += "You took " + battleState.hpLoss + " chip damage.\n";
				}
				else{

					endMessageString += "You recovered " + Math.abs(battleState.hpLoss) + " HP!\n";
				}
				battleState.endMessages.forEach(function(endMessage){

					endMessageString += endMessage + "\n";
				});
			}
			//If loss
			else{

				//Postresults determinations
				state.postresults(message, character, battleState, actives, grumbo);

				//Calculate postresults variables
				character.battlesLeft -= 1;
				character.losses += 1;
				character.winrate = Math.floor(((character.wins / (character.wins + character.losses)) * 100));

				endMessageString += grumbo.loss.replace('$name', username) + "\n";
				battleState.preResMessages.forEach(function(preResMessage){

					endMessageString += preResMessage + "\n";
				});
				if(battleState.hpLoss >= 0){

					endMessageString += "You took " + battleState.hpLoss + " damage!\n";
				}
				else{

					endMessageString += "You recovered " + Math.abs(battleState.hpLoss) + " HP!\n";
				}
				battleState.endMessages.forEach(function(endMessage){

					endMessageString += endMessage + "\n";
				});
			}

			character.hp -= battleState.hpLoss;
			if(character.hp < 0) character.hp = 0;
			else if(character.hp > charfunc.MAX_HP) character.hp = charfunc.MAX_HP;
			character.classExp += battleState.classExp;
			classfunc.levelUpClass(character, battleState);

			endMessageString += "Here are your current stats:\n" + username + " Lv" + character.level + "  |  "
					+ character.experience + " EXP  |  " + character.hp + " HP  |  " + character.gold + " Gold  |  Wins " + character.wins
					+ "  |  Losses " + character.losses + "   |   Win% " + character.winrate + "\n"
					+ classList[character.classId].className + " Lv" + character.classLevel + "  |  " + character.classExp + " Class EXP" + "\n"
					+ "You have " + character.battlesLeft + "/5 battles left"
			message.channel.send(endMessageString);

			character.battleLock = false;

			//Save battle results
			dbfunc.updateCharacter(character);
		}, 5000);
	});
}

/**
* Calculate battle experience gained.
*/
exports.calculateBattleExp = function(character, levelDiff, battleState){

	var exp = 100;
	//Low level Grumbo
	if(levelDiff > 0){

		exp = calculateLowLevelExp(exp, levelDiff);
	}
	//High level Grumbo
	else if(levelDiff < 0){

		exp = calculateHighLevelExp(exp, levelDiff);
	}
	exp = exp + Math.floor(Math.random() * 10) - 5 - Math.ceil(character.level/1.5) + 1 + battleState.expMod;
	if(exp < 3){

		exp = 3;
	}
	return exp;
}

/**
* Calculate experience gain against a Grumbo who is a lower level than you.
*/
function calculateLowLevelExp(exp, levelDiff){

	exp = exp - Math.floor(levelDiff * Math.pow(1.057, levelDiff)) - (Math.floor(Math.random() * 10) + 3);
	if(levelDiff > 3){

		exp = exp - (Math.floor(Math.random() * 10) + 4);
	}
	if(levelDiff > 7){

		exp = exp - (Math.floor(Math.random() * 10) + 5);
	}
	if(levelDiff > 12){

		exp = exp - (Math.floor(Math.random() * 10) + 6);
	}
	if(levelDiff > 17){

		exp = exp - (Math.floor(Math.random() * 10) + 6);
	}
	return exp;
}

/**
* Calculate experience gain against a Grumbo who is a higher level than you.
*/
function calculateHighLevelExp(exp, levelDiff){

	exp = exp - Math.ceil(levelDiff * Math.pow(1.142, Math.abs(levelDiff))) + Math.floor(Math.random() * 25) + 5;
	if(levelDiff < -3){

		exp = exp + Math.floor(Math.random() * 20) + 10;
	}
	if(levelDiff < -7){

		exp = exp + Math.floor(Math.random() * 25) + 15;
	}
	if(levelDiff < -12){

		exp = exp + Math.floor(Math.random() * 35) + 20;
	}
	if(levelDiff < -16){

		exp = exp + Math.floor(Math.random() * 40) + 25;
	}
	if(levelDiff == -20){

		exp = exp + Math.floor(Math.random() * 45) + 30;
	}
	return exp;
}

/**
* Calculate battle gold gained.
*/
exports.calculateBattleGold = function(character, levelDiff){

	var gold = 135 + Math.floor(Math.random() * 50) + levelDiff;
	if(levelDiff > 20){

		//Only get 10 gold if you fight a Grumbo who is less than 20 levels under you
		gold = 10;
	}
	else if(levelDiff < 15 && levelDiff >= 10){

		gold = gold - (Math.random() * 25) - 10;
	}
	else if(levelDiff < 10 && levelDiff >= 5){

		gold = gold - (Math.random() * 35) - 25;
	}
	else if(levelDiff < 5 && levelDiff >= 0){

		gold = gold - (Math.random() * 45) - 60 - ((5 - levelDiff) * 2);
	}
	//Grumbo is higher level than you, lower gold amount significantly
	else if(levelDiff < 0){

		gold = gold - (Math.random() * 40) - 75 + (levelDiff * 1.5);
	}
	if(gold < 10){

		gold = 10;
	}
	return Math.ceil(gold);
}

/**
* Calculates the prebattle character mods.
*/
exports.calculateCharacterMods = function(message, args, character, battleState, actives, grumbo){

	exports.calculateHPMod(character, battleState);
	exports.calculatePOWMod(character, grumbo, battleState);
	exports.calculateWISMod(character, grumbo, battleState);
}

/**
* Calculates the hp chance mod.
*/
exports.calculateHPMod = function(character, battleState){

	if(character.hp >= charfunc.MAX_HP - 5){

		battleState.hpMod += 5;
	}
	else if(character.hp <= 0){

		battleState.hpMod -= 50;
	}
	else if(character.hp <= 5){

		battleState.hpMod -= 25;
	}
	else if(character.hp <= 20){

		battleState.hpMod -= 10;
	}
	else if(character.hp <= 45){

		battleState.hpMod -= 5;
	}
}

/**
* Calculates the pow chance mod. Max 10 before actives.
*/
exports.calculatePOWMod = function(character, grumbo, battleState){

	battleState.powMod += Math.ceil((character.pow - grumbo.pow)/4);
	if(battleState.powMod > 10)	battleState.powMod = 10;
}

/**
* Calculates the wis chance mod. Max 10 before actives.
*/
exports.calculateWISMod = function(character, grumbo, battleState){

	battleState.wisMod += Math.ceil((character.wis - grumbo.wis)/6);
	if(battleState.wisMod > 10) battleState.wisMod = 10;
}

/**
* Calculates HP Loss. Max 50 before actives.
*/
exports.calculateHPLoss = function(message, character, battleState, actives, grumbo){

	if(!battleState.win || battleState.isBoss){

		var dmg = Math.floor((grumbo.pow - character.def)/2.2);
		if(dmg < 0) dmg = 0;
		battleState.hpLoss += dmg;
	}
}

/**
* Randomize Grumbo.
*/
function getRandomGrumbo(grumboLevel){

	var random = Math.floor(Math.random() * (weighedGrumbos.length - 1));
	var grumboId = weighedGrumbos[random];
	var grumbo = grumboList[grumboId];
	calculateGrumboStats(grumbo, grumboLevel);

	return grumbo;
}

/**
* Calculate Grumbo stats.
*/
function calculateGrumboStats(grumbo, grumboLevel){

	grumbo.pow = Math.ceil((grumbo.powBase + (grumboLevel*1)) * grumbo.powX) + Math.floor(Math.random() * 4) - 2;
	grumbo.wis = Math.ceil((grumbo.wisBase + (grumboLevel*1)) * grumbo.wisX) + Math.floor(Math.random() * 4) - 2;
}


/**
* Determines if x is an integer.
*/
function isInteger(x){

	return !isNaN(x) && (x % 1 === 0);
}
