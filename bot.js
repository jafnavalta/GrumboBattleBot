var Discord = require('discord.js');
var auth = require('./auth.json');

// Initialize Discord Bot
const client = new Discord.Client();

const fs = require("fs");
let levels = JSON.parse(fs.readFileSync("./levels.json", "utf8"));

var onHold = false;

client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has begun battle, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`); 
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  client.user.setActivity(`Battling ${client.users.size} dudes in ${client.guilds.size} servers`);
});

client.on("message", async message => {
	
	// Ignore self
	if(message.author.bot) return;
	
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!grumbo`
    if(message.content.substring(0, 7) == '!grumbo'){
		
		//If this is the first time the user has commanded Grumbo, initialize user
		if (!levels[message.author.id]){ 
		
			levels[message.author.id] = {
				
				level: 1,
				experience: 0,
				id: message.author.id,
				wins: 0,
				losses: 0,
				winrate: 0,
				battlesLeft: 3,
				battletime: 9999999999999
			};
			
			//Save new character
			fs.writeFile("./levels.json", JSON.stringify(levels), (err) => {
						
				if (err) console.error(err)
			});
		}
		
		//Can't do more than one battle at once.
		if(onHold){
			
			message.channel.send("A battle is currently ongoing! Try again later.");
			return;
		}
		
		//Get character stats, parse command and get users name
		var character = levels[message.author.id];
        var args = message.content.split(' ');
		var username = message.member.displayName;
		
		//Returns users stats
		if(args.length == 2 && args[1] == 'help'){
			
			message.channel.send("Try your chance in battle with me, gain experience, level up, and be the strongest on the server :^ )\n\n"
				+ "GRUMBO HELP: COMMANDS\n"
				+ "!grumbo battle level <integer> | Battle a level <integer> Grumbo. The higher the level compared to yours, the lower the chance of winning (but higher chance of more experience!)\n"
				+ "!grumbo stats | See your grumbo stats (Level, exp, wins, losses, win rate) and how many battles you have left\n"
				+ "!grumbo leaderboards | See the stats of everyone on the server who has interacted with GrumboBattleBot, sorted by level\n"
				+ "!grumbo help | Show this help menu"); 
		}
		else if(args.length == 2 && args[1] == 'stats'){
			
			//Determine how many battles they should have left
			var date = new Date();
			var currentTime = date.getTime();
			var timeSinceLastBattle = character.battletime - currentTime;
			var setNewBattletime = false;
			var addBattles = Math.floor(timeSinceLastBattle/3600000);
			if(addBattles > 0){
				
				setNewBattletime = true;
				character.battlesLeft += addBattles;
				if(character.battlesLeft <= 3){
					
					character.battletime = character.battletime + (addBattles * 3600000);
				}
				if(character.battlesLeft > 3){
					
					character.battlesLeft = 3;
				}
			}
			
			var statsString = username + " Lv" + character.level + " with " + character.experience + " EXP  |  Wins " + character.wins 
							+ "  |  Losses " + character.losses + "  |  Win% " + character.winrate 
							+ "\nYou have " + character.battlesLeft + "/3 battles left";
			if(character.battlesLeft < 3){
				
				var date = new Date();
				var currentTime = date.getTime();
				var timeUntilNextBattleInMinutes = Math.floor((character.battletime + 3600000 - currentTime)/60000);
				statsString = statsString + "\nYou will gain another battle chance in " + timeUntilNextBattleInMinutes + " minutes";
			}
			message.channel.send(statsString);

			//Save battle results
			fs.writeFile("./levels.json", JSON.stringify(levels), (err) => {
				
				if (err) console.error(err)
			});
		}
		//Returns leaderboards of server
		else if(args.length == 2 && args[1] == 'leaderboards'){
			
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
			characters.forEach(function(sortedCharacter){
				
				//Only show people in the server
				if(message.guild.members.get(sortedCharacter.id) != undefined){
					
					leaderboards = leaderboards + message.guild.members.get(sortedCharacter.id).displayName + " Lv" + sortedCharacter.level 
						+ "  |  " + sortedCharacter.experience + " EXP  |  Wins " + sortedCharacter.wins 
						+ "  |  Losses " + sortedCharacter.losses + "  |  Win% " + sortedCharacter.winrate + "\n";
				}
			});
			leaderboards = leaderboards + "\n--------------------------------"
			message.channel.send(leaderboards);
		}
		else if(args.length == 4 && args[1] == 'battle' && args[2] == 'level' && isInteger(args[3])){
			
			//Determine how many battles they should have left
			var date = new Date();
			var currentTime = date.getTime();
			var timeSinceLastBattle = character.battletime - currentTime;
			var setNewBattletime = false;
			var addBattles = Math.floor(timeSinceLastBattle/3600000);
			if(addBattles > 0){
				
				setNewBattletime = true;
				character.battlesLeft += addBattles;
				if(character.battlesLeft <= 3){
					
					character.battletime = character.battletime + (addBattles * 3600000);
				}
				if(character.battlesLeft > 3){
					
					character.battlesLeft = 3;
				}
			}
			
			if(args[3] < 1){
				
				//Can't fight negative or 0 level Grumbos
				message.channel.send("Bruh, you can't choose a level less than 1 you scrub");
			}
			else if((character.level - args[3]) < -20){
				
				//Can't fight a Grumbo who is over 20 levels higher than you
				var maxLevel = character.level + 20;
				message.channel.send("Pick a fight up to 20 levels higher than your own level you fool\nYour current limit is Grumbo Lv" + maxLevel);
			}
			else if(character.battlesLeft == 0){
				
				//No battles left
				var timeUntilNextBattleInMinutes = Math.floor((character.battletime + 3600000 - currentTime)/60000);
				message.channel.send("You don't have any battles left. You get a battle chance every 1 hour up to a maximum stock of 3 battles. You can battle again in "
					+ timeUntilNextBattleInMinutes + " minutes");
			}
			else{
				
				onHold = true;
				
				//Calculate victory chance, max 99%, min 10%
				var levelDiff = character.level - args[3];
				var chance = 50 + (levelDiff * 2) + Math.floor(Math.random() * 10) - 5;
				if(chance > 99){
					
					chance = 99;
				}
				else if(chance < 10){
					
					chance = 10;
				}
				
				message.channel.send(username + " Lv" + character.level + "   VS   Grumbo Lv" + args[3]
					+ "\n" + username + " has a " + chance + "% chance of victory"
					+ "\nBattle in progress, please wait a moment...");
					
				//Wait 3 seconds before determining/displaying battle results
				setTimeout(function(){
					
					//Determine battle results
					var result = Math.floor(Math.random() * 100) + 1;
					
					//If victory
					if(result <= chance){
						
						//Calculate experience gained
						var exp = 100;
						//Low level Grumbo
						if(levelDiff > 0){
								
							exp = exp - Math.floor(levelDiff * Math.pow(1.057, levelDiff)) - (Math.floor(Math.random() * 10) + 1);
							if(levelDiff > 4){
								
								exp = exp - (Math.floor(Math.random() * 12) + 2);
							}
							if(levelDiff > 12){
								
								exp = exp - (Math.floor(Math.random() * 15) + 4);
							}
							if(exp < 1){
								
								exp = 1;
							}
						}
						//High level Grumbo
						else if(levelDiff < 0){
							
							exp = exp - Math.ceil(levelDiff * Math.pow(1.2, levelDiff)) + Math.floor(Math.random() * 35) + 5;
							if(levelDiff < -4){
								
								exp = exp + Math.floor(Math.random() * 50) + 20;
							}
							if(levelDiff < -9){
								
								exp = exp + Math.floor(Math.random() * 80) + 40;
							}
							if(levelDiff == -20){
								
								exp = exp + Math.floor(Math.random() * 125) + 75;
							}
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
						
						//TODO customize the win/loss messages
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
						
						if(setNewBattletime){
							
							if(currentTime < character.battletime){
								
								character.battletime = currentTime;
							}
						}
						
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
		}
		else{
			
			//Bad commands
			message.channel.send('Invalid Grumbo command. Type !grumbo help to see a list of commands.');
		}
     }
	 else{
		 
		 //Ignore all other messages that don't begin with the !grumbo prefix
		 return;
	 }
});

//Determines if x is an integer
function isInteger(x){
	
	return !isNaN(x) && (x % 1 === 0);
}

client.login(auth.token);