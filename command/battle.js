//Initialize DB functions
let dbfunc = require('../data/db.js');

//Initialize fs
const fs = require("fs");

//Initialize state for state constants and functions
let state = require('../state.js');

//Initialize list of grumbos file
let grumboList = JSON.parse(fs.readFileSync("./values/grumbos.json", "utf8"));

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
			else if(character.battlesLeft == 0){
				
				var timeUntilNextBattleInMinutes = Math.ceil((character.battletime + 3600000 - currentTime)/60000);
				message.channel.send("You don't have any battles left. You get a battle chance every 1 hour up to a maximum stock of 3 battles. You can battle again in "
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
	var addBattles = Math.floor(timeSinceLastBattle/3600000);
	if(addBattles > 0){
		
		character.battlesLeft += addBattles;
		if(character.battlesLeft < 3){
			
			character.battletime = character.battletime + (addBattles * 3600000);
		}
		if(character.battlesLeft >= 3){
			
			character.battlesLeft = 3;
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
		var grumbo = getRandomGrumbo();
		var battleState = {};
		state.prebattle(message, args, character, battleState, actives, grumbo);
		
		if(character.battlesLeft == 3){
			
			character.battletime = currentTime;
		}
		
		var username = message.member.displayName;
		message.channel.send(username + " Lv" + character.level + "   VS   " + grumbo.name + " Lv" + args[3] + "\n"
			+ username + " has a " + battleState.chance + "% chance of victory\n"
			+ "Battle in progress, please wait a moment...\n");
			
		//Wait 5 seconds before determining/displaying battle results
		setTimeout(function(){
			
			//Determine battle results
			var result = Math.floor(Math.random() * (101));
			
			//If victory
			if(result <= battleState.chance){
				
				//Preresults determinations
				battleState.win = true;
				state.preresults(message, character, battleState, actives, grumbo);
				
				//Postresults determinations
				state.postresults(message, character, battleState, actives, grumbo);
				
				//TODO customize message
				var endMessageString = grumbo.victory.replace('$name', username) + "\n";
				endMessageString += "You gained " + battleState.exp + " experience for " + battleState.gains + " level(s)! You also gained " + battleState.gold + " gold!\n";
				battleState.endMessages.forEach(function(endMessage){
					
					endMessageString += endMessage + "\n";
				});
				endMessageString += "Here are your current stats:\n" + username + " Lv" + character.level + "  |  " 
					+ character.experience + " EXP  |  " + character.gold + " Gold  |  Wins " + character.wins 
					+ "  |  Losses " + character.losses + "   |   Win% " + character.winrate + "\n"
					+ "You have " + character.battlesLeft + "/3 battles left"
				message.channel.send(endMessageString);
			}
			//If loss
			else{
				
				//Preresults determinations
				battleState.win = false;
				state.preresults(message, character, battleState, actives, grumbo);
				
				//Postresults determinations
				state.postresults(message, character, battleState, actives, grumbo);
				
				//customize message
				var endMessageString = grumbo.loss.replace('$name', username) + "\n";
				battleState.endMessages.forEach(function(endMessage){
					
					endMessageString += endMessage + "\n";
				});
				endMessageString += "Here are your current stats:\n" + username + " Lv" + character.level + "  |  " 
					+ character.experience + " EXP  |  " + character.gold + " Gold  |  Wins " + character.wins 
					+ "  |  Losses " + character.losses + "   |   Win% " + character.winrate + "\n"
					+ "You have " + character.battlesLeft + "/3 battles left"
				message.channel.send(endMessageString);
			}
			
			character.battleLock = false;
			
			//Save battle results
			dbfunc.updateCharacter(character);
		}, 5000);
	});
}

/**
* Calculate battle experience gained.
*/
exports.calculateBattleExp = function(character, levelDiff){
	
	var exp = 100;
	//Low level Grumbo
	if(levelDiff > 0){
			
		exp = calculateLowLevelExp(exp, levelDiff);
	}
	//High level Grumbo
	else if(levelDiff < 0){
		
		exp = calculateHighLevelExp(exp, levelDiff);
	}
	exp = exp + Math.floor(Math.random() * 10) - 5 - character.level + 1;
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
	
	exp = exp - Math.ceil(levelDiff * Math.pow(1.135, Math.abs(levelDiff))) + Math.floor(Math.random() * 25) + 5;
	if(levelDiff < -3){
		
		exp = exp + Math.floor(Math.random() * 20) + 5;
	}
	if(levelDiff < -7){
		
		exp = exp + Math.floor(Math.random() * 25) + 10;
	}
	if(levelDiff < -12){
		
		exp = exp + Math.floor(Math.random() * 35) + 15;
	}
	if(levelDiff < -16){
		
		exp = exp + Math.floor(Math.random() * 35) + 15;
	}
	if(levelDiff == -20){
		
		exp = exp + Math.floor(Math.random() * 40) + 20;
	}
	return exp;
}

/**
* Calculate battle gold gained.
*/
exports.calculateBattleGold = function(character, levelDiff){
	
	var gold = 120 + Math.floor(Math.random() * 25) + levelDiff;
	if(levelDiff > 20){
		
		//Only get 1 gold if you fight a Grumbo who is less than 20 levels under you
		gold = 1;
	}
	else if(levelDiff < 15 && levelDiff >= 10){
		
		gold = gold - (Math.random() * 25) - 15;
	}
	else if(levelDiff < 10 && levelDiff >= 5){
		
		gold = gold - (Math.random() * 35) - 30;
	}
	else if(levelDiff < 5 && levelDiff >= 0){
		
		gold = gold - (Math.random() * 45) - 60 - ((5 - levelDiff) * 2);
	}
	//Grumbo is higher level than you, lower gold amount significantlys
	else if(levelDiff < 0){
		
		gold = gold - (Math.random() * 40) - 75 + (levelDiff * 1.5);
	}
	if(gold < 10){
		
		gold = 10;
	}
	return Math.ceil(gold);
}

/**
* Randomize Grumbo.
*/
function getRandomGrumbo(){
	
	var random = Math.floor(Math.random() * (weighedGrumbos.length - 1));
	var grumboId = weighedGrumbos[random];
	return grumboList[grumboId];
}


/**
* Determines if x is an integer.
*/
function isInteger(x){
	
	return !isNaN(x) && (x % 1 === 0);
}