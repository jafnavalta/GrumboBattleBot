var Discord = require('discord.js');
var auth = require('./auth.json');

// Initialize Discord Bot
const client = new Discord.Client();

const fs = require("fs");
let levels = JSON.parse(fs.readFileSync("./levels.json", "utf8"));

//Lock for Grumbo battles
var onHold = false;

//Locks for challenges (PvP)
var onChallenge = false;
var onChallengeAccept = false;
var challengerID = null;
var opponentID = null;
var wager = 0;

client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has begun battle, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`); 
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  client.user.setActivity(`Battling ${client.users.size} dudes in ${client.guilds.size} servers`);
  
  updateCharacters();
});

client.on("message", async message => {
	
	// Ignore self
	if(message.author.bot) return;
	
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!grumbo`
    if(message.content.substring(0, 7) == '!grumbo'){
		
		//If this is the first time the user has commanded Grumbo, initialize character
		if (!levels[message.author.id]){ 
		
			createNewCharacter(message);
		}
		
		//Can't do more than one battle at once.
		if(onHold){
			
			message.channel.send("A battle is currently ongoing! Try again later.");
			return;
		}
		
		//Get character stats, parse command and get users name
		var character = levels[message.author.id];
        var args = message.content.split(' ');
		
		//Display help menu
		if(args.length == 2 && args[1] == 'help'){
			
			message.channel.send("Try your chance in battle with me, gain experience, level up, and be the strongest on the server :^ )\n\n"
				+ "GRUMBO HELP: COMMANDS\n"
				+ "!grumbo battle level <number>  |  Battle a level <number> Grumbo. The higher the level compared to yours, the lower the chance of winning (but higher chance of more experience!)\n"
				+ "!grumbo challenge @mention <number>  |  Challenge another user by mentionning them with @ and putting <number> experience on the line!\n"
				+ "!grumbo challenge accept <number>  |  If you've been challenged, you can accept it with this command. <number> must match the challenger's wager.\n"
				+ "!grumbo stats  |  See your grumbo stats (Level, exp, wins, losses, win rate) and how many battles you have left\n"
				+ "!grumbo leaderboards  |  See the stats of everyone on the server who has interacted with GrumboBattleBot, sorted by level\n"
				+ "!grumbo patchnotes  |  Show the recent patch notes\n"
				+ "!grumbo help  |  Show this help menu"); 
		}
		//Display patch notes
		else if(args.length == 2 && args[1] == 'patchnotes'){
			
			message.channel.send("GRUMBO PATCH NOTES\n\n"
			
				+ "- Added PvP with the challenge command. Wager experience.\n\n"
			
				+ "OLDER NOTES\n"
				+ "- Changed xp scaling for higher level Grumbos\n"
				+ "- Minimum victory chance changed from 10% to 5%\n"
				+ "- Added patch notes L U L");
		}
		//Display users stats
		else if(args.length == 2 && args[1] == 'stats'){
			
			displayStats(character, message);
		}
		//Returns leaderboards of server
		else if(args.length == 2 && args[1] == 'leaderboards'){
			
			displayLeaderboards(message);
		}
		
		//////////////////
		// !! BATTLE !! //
		//////////////////
		else if(args.length == 4 && args[1] == 'battle' && args[2] == 'level' && isInteger(args[3])){
			
			//Determine how many battles they should have left
			var date = new Date();
			var currentTime = date.getTime();
			var timeSinceLastBattle = currentTime - character.battletime;
			var setNewBattletime = false;
			var addBattles = Math.floor(timeSinceLastBattle/3600000);
			if(addBattles > 0){ //Set new time if new player as well
				
				setNewBattletime = true;
				character.battlesLeft += addBattles;
				if(character.battlesLeft <= 3){
					
					character.battletime = character.battletime + (addBattles * 3600000);
				}
				if(character.battlesLeft > 3){
					
					character.battlesLeft = 3;
				}
			}
			if(setNewBattletime || character.battletime >= 9999999999999){
							
				if(currentTime < character.battletime){
					
					character.battletime = currentTime;
				}
			}
			
			//User tried to fight a Grumbo who has a level lower than 1
			if(args[3] < 1){
				
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
				
				var timeUntilNextBattleInMinutes = Math.floor((character.battletime + 3600000 - currentTime)/60000);
				message.channel.send("You don't have any battles left. You get a battle chance every 1 hour up to a maximum stock of 3 battles. You can battle again in "
					+ timeUntilNextBattleInMinutes + " minutes");
			}
			//BATTLE
			else{
				
				doBattle(message, args, character, currentTime, setNewBattletime);
			}
		}
		
		/////////////////////
		// !! CHALLENGE !! //
		/////////////////////
		else if(args.length == 4 && args[1] == 'challenge'){
			
			//Determine how many challenges they should have left
			var date = new Date();
			var currentTime = date.getTime();
			var timeSinceLastChallenge = currentTime - character.challengetime;
			var setNewChallengetime = false;
			var addChallenges = Math.floor(timeSinceLastChallenge/3600000);
			if(addChallenges > 0){ //Set new time if new player as well
				
				setNewChallengetime = true;
				character.challengesLeft += addChallenges;
				if(character.challengesLeft <= 3){
					
					character.challengetime = character.challengetime + (addChallenges * 3600000);
				}
				if(character.challengesLeft > 3){
					
					character.challengesLeft = 3;
				}
			}
			if(setNewChallengetime || character.challengetime >= 9999999999999){
							
				if(currentTime < character.challengetime){
					
					character.challengetime = currentTime;
				}
			}
			
			var opponent = message.mentions.members.first();
			
			//No challenges left
			if(character.challengesLeft <= 0){
				
				var timeUntilNextChallengeInMinutes = Math.floor((character.challengetime + 3600000 - currentTime)/60000);
				message.channel.send("You don't have any challenges left. You get a challenge every 1 hour up to a maximum stock of 3 challenges. You can challenge again in "
					+ timeUntilNextChallengeInMinutes + " minutes");
			}
			//User issued a challenge
			else if(opponent != null && isInteger(args[3])){
				
				if(message.author.id == opponent.id){
					
					message.channel.send("You can't challenge yourself bud.");
				}
				else if(!onChallenge && !onChallengeAccept){
					
					var totalExp = ((character.level - 1) * 100) + character.experience;
					if(args[3] > 100 || args[3] < 1){
						
						message.channel.send("The wager must be between 1 and 100");
					}
					else if(args[3] <= totalExp){
						
						issueChallenge(message, opponent, args);
					}
					else{
						
						message.channel.send("You don't have enough experience for that wager.");
					}
				}
				else{
					
					message.channel.send('Someone has already issued a challenge or the last challenge was too recent! Try again later.');
				}
			}
			//User accepted a challenge
			else if(args[2] == 'accept' && isInteger(args[3])){
				
				if(message.author.id == opponentID){
					
					var totalExp = ((character.level - 1) * 100) + character.experience;
					if(args[3] != wager){
						
						message.channel.send('The wager must match the challenger\'s wager of ' + wager);
					}
					else if(args[3] > totalExp){
						
						message.channel.send("You don't have enough experience for that wager.");
					}
					else{
						
						doChallenge(message, character, currentTime, setNewChallengetime);
					}
				}
				else{
					
					message.channel.send('You have not been challenged ' + message.member.displayName);
				}
			}
			//Bad challenge command
			else{
				
				message.channel.send("If you are challenging someone, mention an opponent with @ after 'challenge' followed by your exp wager.\n"
					+ "If you are being challenged, type '!grumbo challenge accept <number>'. <number> must match challenger's exp wager.\n"
					+ "Type '!grumbo help' for more info.");
			}
		}
		
		//Bad command
		else{
			
			message.channel.send('Invalid Grumbo command. Type !grumbo help to see a list of commands.');
		}
     }
	 else{
		 
		 //Ignore all other messages that don't begin with the !grumbo prefix
		 return;
	 }
});

/**
* Create a new character and save it.
*/
function createNewCharacter(message){
	
	levels[message.author.id] = {
				
		level: 1,
		experience: 0,
		id: message.author.id,
		wins: 0,
		losses: 0,
		winrate: 0,
		battlesLeft: 3,
		battletime: 9999999999999,
		challengeWins: 0,
		challengeLosses: 0,
		challengeWinrate: 0,
		challengesLeft: 3,
		challengetime: 9999999999999
	};

	//Save new character
	fs.writeFile("./levels.json", JSON.stringify(levels), (err) => {
				
		if (err) console.error(err)
	});
}

/**
* Display stats. Also calculate how many battles you currently have.
*/
function displayStats(character, message){
	
	//Determine how many battles they should have left
	var date = new Date();
	var currentTime = date.getTime();
	var timeSinceLastBattle = currentTime - character.battletime;
	var addBattles = Math.floor(timeSinceLastBattle/3600000);
	if(addBattles > 0){
		
		character.battlesLeft += addBattles;
		if(character.battlesLeft <= 3){
			
			character.battletime = character.battletime + (addBattles * 3600000);
		}
		if(character.battlesLeft > 3){
			
			character.battlesLeft = 3;
		}
	}
	
	//Determine how many battles they should have left
	var timeSinceLastChallenge = currentTime - character.challengetime;
	var addChallenges = Math.floor(timeSinceLastChallenge/3600000);
	if(addChallenges > 0){
		
		character.challengesLeft += addChallenges;
		if(character.challengesLeft <= 3){
			
			character.challengetime = character.challengetime + (addChallenges * 3600000);
		}
		if(character.challengesLeft > 3){
			
			character.challengesLeft = 3;
		}
	}
	
	var username = message.member.displayName;
	var statsString = username + " Lv" + character.level + " with " + character.experience + " EXP"
					+ "\nBattle          Wins " + character.wins + "  |  Losses " + character.losses + "  |  Win% " + character.winrate
					+ "\nChallenge  Wins " + character.challengeWins + "  |  Losses " + character.challengeLosses + "  |  Win% " + character.challengeWinrate
					+ "\nYou have " + character.battlesLeft + "/3 battles left"
					+ "\nYou have " + character.challengesLeft + "/3 challenges left";
	if(character.battlesLeft < 3){
		
		var timeUntilNextBattleInMinutes = Math.floor((character.battletime + 3600000 - currentTime)/60000);
		statsString = statsString + "\nYou will gain another battle chance in " + timeUntilNextBattleInMinutes + " minutes";
	}
	if(character.challengesLeft < 3){
		
		var timeUntilNextChallengeInMinutes = Math.floor((character.challengetime + 3600000 - currentTime)/60000);
		statsString = statsString + "\nYou will gain another challenge in " + timeUntilNextChallengeInMinutes + " minutes";
	}
	message.channel.send(statsString);

	//Save battle results
	fs.writeFile("./levels.json", JSON.stringify(levels), (err) => {
		
		if (err) console.error(err)
	});
}

/**
* Display leaderboards. Sorts by level, then by experience.
*/
function displayLeaderboards(message){
	
	var characters = [];
	for(var key in levels){
		
		characters.push(levels[key]);
	}
	
	//Sort based on level first, then experience
	characters.sort(function(a, b){
		var keyA = a.level,
			keyB = b.level,
			xpA = a.experience,
			xpB = b.experience;
			
		//Compare the users
		if(keyA < keyB) return 1;
		if(keyA > keyB) return -1;
		if(xpA < xpB) return 1;
		if(xpA > xpB) return -1;
		return 0;
	});
	
	var leaderboards = "------LEADERBOARDS------\n\n"
	var count = 1;
	characters.forEach(function(sortedCharacter){
		
		//Only show people in the server
		if(message.guild.members.get(sortedCharacter.id) != undefined){
			
			leaderboards = leaderboards + "[" + count + "] " + message.guild.members.get(sortedCharacter.id).displayName + " Lv" + sortedCharacter.level + "  |  " + sortedCharacter.experience + " EXP" 
				+ "\n--- Battle          Wins " + sortedCharacter.wins + "  |  Losses " + sortedCharacter.losses + "  |  Win% " + sortedCharacter.winrate
				+ "\n--- Challenge  Wins " + sortedCharacter.challengeWins + "  |  Losses " + sortedCharacter.challengeLosses + "  |  Win% " + sortedCharacter.challengeWinrate + "\n";
			count += 1;
		}
	});
	leaderboards = leaderboards + "\n--------------------------------"
	message.channel.send(leaderboards);
}

/**
* Do battle 
*/
function doBattle(message, args, character, currentTime, setNewBattletime){

	//Don't allow other battles while this one is going on
	onHold = true;

	//Calculate victory chance, max 99%, min 10%
	var levelDiff = character.level - args[3];
	var chance = 50 + (levelDiff * 2) + Math.floor(Math.random() * 6) - 3;
	if(levelDiff < -15){
		
		chance - (Math.floor(Math.random() * 6) + 1);
	}
	if(chance > 99){
		
		chance = 99;
	}
	else if(chance < 5){
		
		chance = 5;
	}
	
	var username = message.member.displayName;
	message.channel.send(username + " Lv" + character.level + "   VS   Grumbo Lv" + args[3]
		+ "\n" + username + " has a " + chance + "% chance of victory"
		+ "\nBattle in progress, please wait a moment...\n");
		
	//Wait 5 seconds before determining/displaying battle results
	setTimeout(function(){
		
		//Determine battle results
		var result = Math.floor(Math.random() * 100) + 1;
		
		//If victory
		if(result <= chance){
			
			//Calculate experience gained
			var exp = 100;
			//Low level Grumbo
			if(levelDiff > 0){
					
				exp = calculateLowLevelExp(exp, levelDiff);
			}
			//High level Grumbo
			else if(levelDiff < 0){
				
				exp = calculateHighLevelExp(exp, levelDiff);
			}
			exp = exp + Math.floor(Math.random() * 10) - 5;
			var leftover = (exp + character.experience) % 100;
			var gains = Math.floor(((exp + character.experience)/100));
			var newLevel = character.level + gains;
			
			if(setNewBattletime){
				
				if(currentTime < character.battletime){
					
					character.battletime = currentTime;
				}
			}
			
			//Win message and results
			character.battlesLeft -= 1;
			character.wins += 1;
			character.level = newLevel;
			character.experience = leftover;
			character.winrate = Math.floor(((character.wins / (character.wins + character.losses)) * 100));
			message.channel.send(username + " won! You gained " + exp + " experience which resulted in " + gains + " level(s)! Here are your current stats:"
				+ "\n" + username + " Lv" + character.level + "  |  " + character.experience + " EXP  |  Wins " + character.wins 
				+ "  |  Losses " + character.losses + "   |   Win% " + character.winrate 
				+ "\nYou have " + character.battlesLeft + "/3 battles left");
		}
		//If loss
		else{
			
			character.battlesLeft -= 1;
			character.losses += 1;
			character.winrate = Math.floor(((character.wins / (character.wins + character.losses)) * 100));
			message.channel.send(username + " lost! Maybe you should try harder my dude"
				+ "\nYou have " + character.battlesLeft + "/3 battles left");
		}
		
		//Save battle results
		fs.writeFile("./levels.json", JSON.stringify(levels), (err) => {
			
			if (err) console.error(err)
		});
		
		onHold = false;
	}, 5000);
}

/**
* Issues a challenge and waits for acceptance.
*/
function issueChallenge(message, opponent, args){
	
	//Set challenge locks
	onChallenge = true;
	challengerID = message.author.id;
	opponentID = opponent.id;
	wager = args[3];
	
	message.channel.send(message.member.displayName + ' has challenged ' + opponent.displayName + ' to a wager of ' + wager + ' experience!\n'
		+ opponent.displayName + ' has 20 seconds to accept the challenge!');
	
	setTimeout(function(){

		if(!onChallengeAccept){
			
			//Unlock challenge if not accepted
			onChallenge = false;
			challengerID = null;
			opponentID = null;
			wager = 0;
			
			message.channel.send(message.member.displayName + '\'s challenge was not accepted.');
		}
		else{
			
			onChallengeAccept = false;
		}
	}, 20000);
}

/**
* Do challenge.
*/
function doChallenge(message, character, currentTime, setNewChallengetime){
	
	onChallengeAccept = true;
	var challenger = levels[challengerID];
	
	//Determine how many challenges they should have left
	var timeSinceLastChallenge = currentTime - challenger.challengetime;
	var setNewChallengerChallengetime = false;
	var addChallenges = Math.floor(timeSinceLastChallenge/3600000);
	if(addChallenges > 0){ //Set new time if new player as well
		
		setNewChallengerChallengetime = true;
		challenger.challengesLeft += addChallenges;
		if(challenger.challengesLeft <= 3){
			
			challenger.challengetime = challenger.challengetime + (addChallenges * 3600000);
		}
		if(challenger.challengesLeft > 3){
			
			challenger.challengesLeft = 3;
		}
	}
	if(setNewChallengerChallengetime || challenger.challengetime >= 9999999999999){
					
		if(currentTime < challenger.challengetime){
			
			challenger.challengetime = currentTime;
		}
	}
	
	//Determine odds
	var levelDiff = character.level - challenger.level;
	var chance = 50 + (levelDiff * 3) + (Math.floor(Math.random() * 2) - 1);
	if(chance > 95){
		
		chance = 95;
	}
	else if(chance < 5){
		
		chance = 5;
	}
	
	message.channel.send(message.member.displayName + " Lv" + character.level + " is facing off against challenger " 
		+ message.guild.members.get(challengerID).displayName + " Lv" + challenger.level + " for " + wager + " experience!\n"
		+ message.member.displayName + " has a " + chance + "% chance of winning!\n"
		+ "The challenge has begun...\n");
	
	//Wait 5 seconds for challenge results
	setTimeout(function(){
		
		//Determine battle results
		var result = Math.floor(Math.random() * 100) + 1;
		
		//If challenger loses
		if(result <= chance){
			
			//Winner results
			calculateChallengeResults(message, character, challenger, 100 - chance, 
				message.member.displayName, message.guild.members.get(challengerID).displayName, 
				currentTime, setNewChallengetime, setNewChallengerChallengetime);
		}
		//Challenger wins
		else{
			
			calculateChallengeResults(message, challenger, character, chance, 
				message.guild.members.get(challengerID).displayName, message.member.displayName, 
				currentTime, setNewChallengerChallengetime, setNewChallengetime);
		}
		
		//Save battle results
		fs.writeFile("./levels.json", JSON.stringify(levels), (err) => {
			
			if (err) console.error(err)
		});
		
		//Release challenge locks
		onChallenge = false;
		challengerID = null;
		opponentID = null;
		wager = 0;
	}, 5000);
}

/**
* Calculate PvP results.
*/
function calculateChallengeResults(message, victor, loser, chance, victorName, loserName, currentTime, setNewChallengetime, setNewLoserChallengetime){
	
	//TODO Add PvP stats
	//TODO Add challengesLeft and challengetime
	
	//Winner results
	var exp = 0;
	var leftover = 0;
	var gains = 0;
	var newLevel = 0;
	
	if(chance > 50){
		
		exp = Math.floor(wager * (chance/50)) + 1;
		leftover = (exp + victor.experience) % 100;
		gains = Math.floor(((exp + victor.experience)/100));
		newLevel = victor.level + gains;
		
		victor.level = newLevel;
		victor.experience = leftover;
	}
	else{
		
		exp = Math.floor(wager * ((((50/chance) - 1) * 2.5) + 1)) + 1;
		leftover = (exp + victor.experience) % 100;
		gains = Math.floor(((exp + victor.experience)/100));
		newLevel = victor.level + gains;
		
		victor.level = newLevel;
		victor.experience = leftover;
	}
	
	//Loser results
	var loserExp = ((loser.level - 1) * 100) + loser.experience - wager;
	var loserLeftover = loserExp % 100;
	var loserLevel = 1 + Math.floor(loserExp/100);
	
	loser.level = loserLevel;
	loser.experience = loserLeftover;
	
	if(setNewChallengetime){
				
		if(currentTime < victor.battletime){
			
			victor.battletime = currentTime;
		}
	}
	if(setNewLoserChallengetime){
				
		if(currentTime < loser.battletime){
			
			loser.battletime = currentTime;
		}
	}
	
	victor.challengesLeft -= 1;
	victor.challengeWins += 1;
	victor.challengeWinrate = Math.floor(((victor.challengeWins / (victor.challengeWins + victor.challengeLosses)) * 100));
	
	loser.challengesLeft -= 1;
	loser.challengeLosses += 1;
	loser.challengeWinrate = Math.floor(((loser.challengeWins / (loser.challengeWins + loser.challengeLosses)) * 100));
	
	message.channel.send("The challenge is over!\n"
		+ victorName + " is the winner! They earned " + exp + " experience! Their stats:\n"
		+ victorName + " Lv" + victor.level + "  |  " + victor.experience + " EXP\n\n"
		+ loserName + " lost " + wager + " experience. Their stats:\n"
		+ victorName + " Lv" + loser.level + "  |  " + loser.experience + " EXP");
}

/**
* Calculate experience gain against a Grumbo who is a lower level than you.
*/
function calculateLowLevelExp(exp, levelDiff){
	
	exp = exp - Math.floor(levelDiff * Math.pow(1.057, levelDiff)) - (Math.floor(Math.random() * 10) + 3);
	if(levelDiff > 4){
		
		exp = exp - (Math.floor(Math.random() * 10) + 4);
	}
	if(levelDiff > 12){
		
		exp = exp - (Math.floor(Math.random() * 12) + 5);
	}
	if(exp < 1){
		
		exp = 1;
	}
	return exp;
}

/**
* Calculate experience gain against a Grumbo who is a higher level than you.
*/
function calculateHighLevelExp(exp, levelDiff){
	
	exp = exp - Math.ceil(levelDiff * Math.pow(1.14, Math.abs(levelDiff))) + Math.floor(Math.random() * 25) + 5;
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
		
		exp = exp + Math.floor(Math.random() * 40) + 20;
	}
	if(levelDiff == -20){
		
		exp = exp + Math.floor(Math.random() * 55) + 30;
	}
	return exp;
}

/**
* Determines if x is an integer.
*/
function isInteger(x){
	
	return !isNaN(x) && (x % 1 === 0);
}

/**
* Updates any outdated characters with missing fields.
*/
function updateCharacters(){
	
	for(var key in levels){
		
		var character = levels[key];
		if(character.challengesLeft == null){
			
			character.challengesLeft = 3;
		}
		if(character.challengeWins == null){
			
			character.challengeWins = 0;
		}
		if(character.challengeLosses == null){
			
			character.challengeLosses = 0;
		}
		if(character.challengeWinrate == null){
			
			character.challengeWinrate = 0;
		}
		if(character.challengetime == null){
			
			character.challengetime = 9999999999999;
		}
	}
	
	//Save updated characters
	fs.writeFile("./levels.json", JSON.stringify(levels), (err) => {
		
		if (err) console.error(err)
	});
}

client.login(auth.token);