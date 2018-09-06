//Initialize fs
const fs = require("fs");

//Initialize state for state constants and functions
let state = require('../state.js');

/**
* Battle command
*/
exports.commandBattle = function(levels, message, args, character){
	
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
				
				doBattle(levels, message, args, character, currentTime);
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
}

/**
* Do battle 
*/
function doBattle(levels, message, args, character, currentTime){

	//Don't allow user to battle multiple times at once
	character.battleLock = true;

	var battleState = {
		
		levelDiffActual: 0,
		levelDiff: 0, 
		chance: 0
	};
	state.prebattle(levels, message, args, character, battleState);
	
	if(character.battlesLeft == 3){
		
		character.battletime = currentTime;
	}
	
	var username = message.member.displayName;
	message.channel.send(username + " Lv" + character.level + "   VS   Grumbo Lv" + args[3]
		+ "\n" + username + " has a " + battleState.chance + "% chance of victory"
		+ "\nBattle in progress, please wait a moment...\n");
		
	//Wait 5 seconds before determining/displaying battle results
	setTimeout(function(){
		
		//Determine battle results
		var result = Math.floor(Math.random() * 100) + 1;
		
		//If victory
		if(result <= battleState.chance){
			
			//Calculate experience gained
			var exp = calculateBattleExp(character, battleState.levelDiff);
			var gold = calculateBattleGold(character, battleState.levelDiff);
			var leftover = (exp + character.experience) % 100;
			var gains = Math.floor(((exp + character.experience)/100));
			var newLevel = character.level + gains;
			
			//Win message and results
			character.battlesLeft -= 1;
			character.wins += 1;
			character.level = newLevel;
			character.experience = leftover;
			character.gold += gold;
			character.winrate = Math.floor(((character.wins / (character.wins + character.losses)) * 100));
			message.channel.send(username + " won! You gained " + exp + " experience for " + gains + " level(s)! You also gained " + gold + " gold! Here are your current stats:"
				+ "\n" + username + " Lv" + character.level + "  |  " + character.experience + " EXP  |  " + character.gold + " Gold  |  Wins " + character.wins 
				+ "  |  Losses " + character.losses + "   |   Win% " + character.winrate 
				+ "\nYou have " + character.battlesLeft + "/3 battles left");
		}
		//If loss
		else{
			
			character.battlesLeft -= 1;
			character.losses += 1;
			character.winrate = Math.floor(((character.wins / (character.wins + character.losses)) * 100));
			message.channel.send(username + " lost! Maybe you should try harder my dude. Here are your current stats:"
				+ "\n" + username + " Lv" + character.level + "  |  " + character.experience + " EXP  |  " + character.gold + " Gold  |  Wins " + character.wins 
				+ "  |  Losses " + character.losses + "   |   Win% " + character.winrate 
				+ "\nYou have " + character.battlesLeft + "/3 battles left");
		}
		
		character.battleLock = false;
		
		//Save battle results
		fs.writeFile("./levels.json", JSON.stringify(levels, null, 4), (err) => {
			
			if (err) console.error(err)
		});
	}, 5000);
}

/**
* Calculate battle experience gained.
*/
function calculateBattleExp(character, levelDiff){
	
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
function calculateBattleGold(character, levelDiff){
	
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
* Determines if x is an integer.
*/
function isInteger(x){
	
	return !isNaN(x) && (x % 1 === 0);
}