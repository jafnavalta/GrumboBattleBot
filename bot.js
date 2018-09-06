var Discord = require('discord.js');
var auth = require('./auth.json');

//Initialize Discord Bot
const client = new Discord.Client();

//Initialize characters
const fs = require("fs");
let levels = JSON.parse(fs.readFileSync("./levels.json", "utf8"));

//Initialize game functions
let state = require('./state.js');
let battlefunc = require('./command/battle.js');
let challengefunc = require('./command/challenge.js');
let itemsfunc = require('./command/items.js');
let activefunc = require('./command/active.js');

client.on("ready", () => {
	
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has begun battle, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`); 
  
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  client.user.setActivity(`Battling ${client.users.size} dudes in ${client.guilds.size} servers`);
  
  //Update characters when bot is restarted in case of updates.
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
		
		//Get character stats, parse command and get users name
		var character = levels[message.author.id];
		var args = message.content.split(' ');
		
		/////////////////////
		// !! HELP MENU !! //
		/////////////////////
		if(args[1] == 'help' && args.length == 2){
			
			message.channel.send("Try your chance in battle with me, gain experience, level up, and be the strongest on the server :^ )\n\n"
				+ "GRUMBO HELP: COMMANDS\n"
				+ "!grumbo battle level <number>  |  Battle a level <number> Grumbo. The higher the level compared to yours, the lower the chance of winning (but higher chance of more experience!)\n"
				+ "!grumbo challenge @mention <number> exp/gold  |  Challenge another user by mentionning them with @ and putting <number> experience/gold on the line!\n"
				+ "!grumbo challenge accept <number> exp/gold  |  If you've been challenged, you can accept it with this command. <number> must match the challenger's wager.\n"
				+ "!grumbo stats  |  See your grumbo stats (Level, exp, gold, wins, losses, win rate) and how many battles/challenges you have left\n"
				+ "!grumbo leaderboards  |  See the stats of everyone on the server who has interacted with GrumboBattleBot, sorted by level\n"
				+ "!grumbo patchnotes  |  Show the recent patch notes\n"
				+ "!grumbo guide  |  Show guide about game mechanics like battles, experience and gold scaling, etc.\n"
				+ "!grumbo help  |  Show this help menu"); 
		}
		
		///////////////////////
		// !! PATCH NOTES !! //
		///////////////////////
		else if(args[1] == 'patchnotes' && args.length == 2){
			
			message.channel.send("GRUMBO PATCH NOTES\n\n"
			
				+ "- Users can now battle at the same time. Challenges are still one at a time.\n"
				+ "- Stats and leaderboards are now private messages.\n"
				+ "- Added gold challenges. Item shop is probably next on the roadmap.\n"
				+ "- Changed challenge commands to accomodate gold challenges.\n\n"
			
				+ "OLDER NOTES\n"
				+ "- Added gold. Gold challenges to be added in next update. Item shop probably follows that.\n"
				+ "- Maximum victory chance changed from 99% to 95%\n"
				+ "- Added guide command for further help.\n"
				+ "- Decreased exp gained in won battles by your current level.\n"
				+ "- Added PvP with the challenge command. Wager experience.\n"
				+ "- Changed xp scaling for higher level Grumbos\n"
				+ "- Minimum victory chance changed from 10% to 5%");
		}
		
		/////////////////
		// !! GUIDE !! //
		/////////////////
		else if(args[1] == 'guide' && args.length == 2){
			
			message.channel.send("GRUMBO BATTLE BOT GUIDE\n\n"
			
				+ "BATTLES\n"
				+ "You can battle any Grumbo whose level is up to 20 levels higher than you. The experience, gold and chance of victory are based on the level difference between "
				+ "your current level and the Grumbo level. As the level of the Grumbo increases, experience increases, but gold and chance of victory decrease. The min victory "
				+ "chance is 5% and the max is 95%. Experience is also decreased independently based on how high your level is. While you get more gold the lower the level of the Grumbo, " 
				+ "you will only get 10 gold if you fight a Grumbo who is over 20 levels lower than you.\n"
				+ "Battle attempts recover 1 stock every hour up to a maximum of 3.\n\n"
				
				+ "CHALLENGES\n"
				+ "Challenge users to a wager.\n"
				+ "Exp challenge: The loser will always lose the wager they bet, but the winner will win a wager based on the chance of victory. This can be less than what was wagered but can also be more.\n"
				+ "Gold challenge: The chance of winning is always a 50/50. You always win/lose exactly what was bet.\n"
				+ "Challenge attempts recover 1 stock every hour up to a maximum of 3.");
		}
		
		/////////////////
		// !! STATS !! //
		/////////////////
		else if(args[1] == 'stats'){
			
			displayStats(character, message, args);
		}
		
		////////////////////////
		// !! LEADERBOARDS !! //
		////////////////////////
		else if(args[1] == 'leaderboards'){
			
			displayLeaderboards(message, args);
		}
		
		//////////////////////////
		// !! ACTIVE EFFECTS !! // 
		//////////////////////////
		else if(args[1] == 'active'){
			
			activefunc.commandActive(character, message, args);
		}
		
		/////////////////
		// !! ITEMS !! //
		/////////////////
		else if(args[1] == 'items'){
			
			itemsfunc.commandItems(levels, message, args, character);
		}
		
		
		//////////////////
		// !! BATTLE !! //
		//////////////////
		else if(args[1] == 'battle'){
			
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
				
				message.channel.send("You don't have any battles left. You get a battle chance every 1 hour up to a maximum stock of 3 battles. You can battle again in "
					+ getTimeLeftUntilNextEvent(character.battletime);
			}
			//BATTLE
			else{
				
				doBattle(message, args, character, currentTime);
			}
			battlefunc.commandBattle(levels, message, args, character);
		}
		
		/////////////////////
		// !! CHALLENGE !! //
		/////////////////////
		else if(args.length == 5 && args[1] == 'challenge'){
			
			challengefunc.commandChallenge(levels, message, args, character);
		}
		
		// Bad command
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
* Display stats. Also calculate how many battles you currently have.
*/
function displayStats(character, message, args){
	
	if(args.length == 2 || (args.length == 3 && args[2] == 'display')){
		
		//DM user
		var sender = message.author;
		if(args.length == 3){
			
			//Message channel
			sender = message.channel;
		}
		
		character.challengesLeft += addChallenges;
		if(character.challengesLeft < 3){
			
			character.challengetime = character.challengetime + (addChallenges * 3600000);
		}
		if(character.challengesLeft >= 3){
			
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
		
		statsString = statsString + "\nYou will gain another battle chance in " + getTimeLeftUntilNextEvent(character.battletime);
	}
	if(character.challengesLeft < 3){
		
		statsString = statsString + "\nYou will gain another challenge in " + getTimeUntilNextEvent(character.challengetime);
	}
	message.channel.send(statsString);
	console.log(currentTime);
	console.log(character.battletime);
	console.log(character.challengetime);

	//Save battle results
	fs.writeFile("./levels.json", JSON.stringify(levels), (err) => {

    //Determine how many battles they should have left
		var date = new Date();
		var currentTime = date.getTime();
		battlefunc.restockBattles(currentTime, character);
		
		//Determine how many challenges they should have left
		challengefunc.restockChallenges(currentTime, character);
		
		var username = message.member.displayName;
		var statsString = username + " Lv" + character.level + " with " + character.experience + " EXP  |  " + character.gold + " Gold"
						+ "\nBattle          Wins " + character.wins + "  |  Losses " + character.losses + "  |  Win% " + character.winrate
						+ "\nChallenge  Wins " + character.challengeWins + "  |  Losses " + character.challengeLosses + "  |  Win% " + character.challengeWinrate
						+ "\nYou have " + character.battlesLeft + "/3 battles left"
						+ "\nYou have " + character.challengesLeft + "/3 challenges left";
		if(character.battlesLeft < 3){
			
			statsString = statsString + "\nYou will gain another battle chance in " + getTimeLeftUntilNextEvent(character.battletime);
		}
		if(character.challengesLeft < 3){
			
			statsString = statsString + "\nYou will gain another challenge in " + getTimeLeftUntilNextEvent(character.challengetime);
		}
		sender.send(statsString);

		//Save battle results
		fs.writeFile("./levels.json", JSON.stringify(levels, null, 4), (err) => {
			
			if (err) console.error(err)
		});
	}
	else{
		
		message.channel.send("Bad stats command. Try '!grumbo help' for the correct command.");
	}
}

/**
* Display leaderboards. Sorts by level, then by experience.
*/
function displayLeaderboards(message, args){
	
	if(args.length == 2 || (args.length == 3 && args[2] == 'display')){
	
		//DM user
		var sender = message.author;
		if(args.length == 3){
			
			//Message channel
			sender = message.channel;
		}
		
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
				
				leaderboards = leaderboards + "[" + count + "] " + message.guild.members.get(sortedCharacter.id).displayName + "   Lv" + sortedCharacter.level + "  |  " 
					+ sortedCharacter.experience + " EXP  |  " + sortedCharacter.gold + " Gold"
					+ "\n      Battle          Wins " + sortedCharacter.wins + "  |  Losses " + sortedCharacter.losses + "  |  Win% " + sortedCharacter.winrate
					+ "\n      Challenge  Wins " + sortedCharacter.challengeWins + "  |  Losses " + sortedCharacter.challengeLosses + "  |  Win% " + sortedCharacter.challengeWinrate + "\n";
				count += 1;
			}
		});
		leaderboards = leaderboards + "\n--------------------------------"
		sender.send(leaderboards);
	}
	else{
		
		message.channel.send("Bad leaderboards command. Try '!grumbo help' for the correct command.");
	}
}

/**
* How much time left until you get another battle.
*/
function getTimeLeftUntilNextEvent(characterEventTime) {
	
	var timeUntilNextBattleInSeconds =  Math.floor(characterEventTime + 3600000 - currentTime)/1000);
	var minutesUntilNextBattle = Math.floor(timeUntilNextBattleInSeconds / 60);
	var secondsUntilNextMinute = timeUntilNextBattleInSeconds - (minutesUntilNextBattle * 60);
	
	//Adds a 0 in front if `secondsUntilNextMinute` is in the single digits
	secondsUntilNextMinute = ('0' + secondsUntilNextMinute).slice(-2);
	
	return minutesUntilNextBattle + "minutes " + secondsUntilNextMinute + "s";
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
		if(character.gold == null){
			
			character.gold = 0;
		}
		if(character.battleLock == null || character.battleLock == true){
			
			character.battleLock = false;
		}
		if(character.items == null){
			
			character.items = ['battle_ticket', 'challenge_ticket', 'battle_potion', 'battle_potion'];
		}
		if(character.active == null){
			
			character.active = [];
		}
		if(character.prebattle == null){
			
			character.prebattle = [];
		}
		if(character.preresults == null){
			
			character.preresults = [];
		}
		if(character.postresults == null){
			
			character.postresults = [];
		}
	}
	
	//Save updated characters
	fs.writeFile("./levels.json", JSON.stringify(levels, null, 4), (err) => {
		
		if (err) console.error(err)
	});
}

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
		battleLock: false,
		challengeWins: 0,
		challengeLosses: 0,
		challengeWinrate: 0,
		challengesLeft: 3,
		challengetime: 9999999999999,
		gold: 0,
		items: ['battle_ticket', 'challenge_ticket', 'battle_potion', 'battle_potion'],
		active: [],
		prebattle: [],
		preresults: [],
		postresults: []
	};

	//Save new character
	fs.writeFile("./levels.json", JSON.stringify(levels, null, 4), (err) => {
				
		if (err) console.error(err)
	});
}

client.login(auth.token);