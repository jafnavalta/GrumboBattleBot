//Initialize fs
const fs = require("fs");

//Initialize DB functions
let dbfunc = require('../data/db.js');

//Initialize functions
let charfunc = require('../character/character.js');

//Locks for challenges (PvP)
var onChallenge = false;
var onChallengeAccept = false;
var challengerID = null;
var opponentID = null;
var wagerType = null;
var wager = 0;

exports.commandChallenge = function(message, args, character){

	//Determine how many challenges they should have left
	var date = new Date();
	var currentTime = date.getTime();
	exports.restockChallenges(currentTime, character);

	var opponent = message.mentions.members.first();

	//No challenges left
	if(character.challengesLeft <= 0){

		var timeUntilNextChallengeInMinutes = Math.ceil((character.challengetime + charfunc.calculateWaitTime(character) - currentTime)/60000);
		message.channel.send("You don't have any challenges left. You get a challenge every 1 hour up to a maximum stock of 3 challenges. You can challenge again in "
			+ timeUntilNextChallengeInMinutes + " minutes");
	}
	//User issued a challenge
	else if(opponent != null && isInteger(args[3])){

		if(message.author.id == opponent.id){

			message.channel.send("You can't challenge yourself bud.");
		}
		else if(!onChallenge && !onChallengeAccept){

			//Exp challenge
			if(args[4] == 'exp'){

				var totalExp = ((character.level - 1) * 100) + character.experience;
				if(args[3] > 100 || args[3] < 1){

					message.channel.send("An experience wager must be between 1 and 100.");
				}
				else if(args[3] <= totalExp){

					wagerType = 'exp';
					issueChallenge(message, opponent, args);
				}
				else{

					message.channel.send("You don't have enough experience for that wager.");
				}
			}
			//Gold challenge
			else if(args[4] == 'gold'){

				if(args[3] > 500 || args[3] < 1){

					message.channel.send("A gold wager must be between 1 and 500.");
				}
				else if(args[3] <= character.gold){

					wagerType = 'gold';
					issueChallenge(message, opponent, args);
				}
				else{

					message.channel.send("You don't have enough gold for that wager.");
				}
			}
			else{

				message.channel.send("Please put either 'exp' or 'gold' as the type of wager.\n"
					+ "Example: !grumbo challenge @GrumboBattleBot 100 gold");
			}
		}
		else{

			message.channel.send('Someone has already issued a challenge or the last challenge was too recent! Try again later.');
		}
	}
	//User accepted a challenge
	else if(args[2] == 'accept' && isInteger(args[3])){

		if(message.author.id == opponentID){

			if(args[4] == 'exp' && wagerType == 'exp'){

				var totalExp = ((character.level - 1) * 100) + character.experience;
				if(args[3] != wager){

					message.channel.send('The wager must match the challenger\'s wager of ' + wager);
				}
				else if(args[3] > totalExp){

					message.channel.send("You don't have enough experience for that wager.");
				}
				else{

					doChallenge(message, character, currentTime);
				}
			}
			else if(args[4] == 'gold' && wagerType == 'gold'){

				if(args[3] != wager){

					message.channel.send('The wager must match the challenger\'s wager of ' + wager);
				}
				else if(args[3] > character.gold){

					message.channel.send("You don't have enough gold for that wager.");
				}
				else{

					doChallenge(message, character, currentTime);
				}
			}
			else{

				message.channel.send("Please put the matching wager type at the end of the command\n"
					+ "Example: !grumbo challenge accept 100 gold");
			}
		}
		else{

			message.channel.send('You have not been challenged ' + message.member.displayName);
		}
	}
	//Bad challenge command
	else{

		message.channel.send("If you are challenging someone, mention an opponent with @ after 'challenge' followed by your exp/gold wager.\n"
			+ "If you are being challenged, type '!grumbo challenge accept <number> exp/gold'. <number> must match challenger's exp/gold wager.\n"
			+ "Type '!grumbo help' for more info.");
	}
}

/**
* Adds challenge attempts to character if possible.
*/
exports.restockChallenges = function(currentTime, character){

	var timeSinceLastChallenge = currentTime - character.challengetime;
	var addChallenges = Math.floor(timeSinceLastChallenge/charfunc.calculateWaitTime(character));
	if(addChallenges > 0){

		character.challengesLeft += addChallenges;
		if(character.challengesLeft < 3){

			character.challengetime = character.challengetime + (addChallenges * charfunc.calculateWaitTime(character));
		}
		if(character.challengesLeft >= 3){

			character.challengesLeft = 3;
		}
	}

	dbfunc.updateCharacter(character);
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

	message.channel.send(message.member.displayName + ' has challenged ' + opponent.displayName + ' to a wager of ' + wager + ' ' + wagerType + '!\n'
		+ opponent.displayName + ' has 25 seconds to accept the challenge!');

	setTimeout(function(){

		if(!onChallengeAccept){

			//Unlock challenge if not accepted
			onChallenge = false;
			challengerID = null;
			opponentID = null;
			wagerType = null;
			wager = 0;

			message.channel.send(message.member.displayName + '\'s challenge was not accepted.');
		}
		else{

			onChallengeAccept = false;
		}
	}, 25000);
}

/**
* Do challenge.
*/
function doChallenge(message, character, currentTime){

	onChallengeAccept = true;
	dbfunc.getDB().collection("characters").findOne({"_id": challengerID}, function(err, challenger){

		//Determine how many challenges they should have left
		exports.restockChallenges(currentTime, challenger);

		if(wagerType == 'exp'){

			doExpChallenge(message, character, challenger, currentTime);
		}
		else{

			doGoldChallenge(message, character, challenger, currentTime);
		}
	});
}

/**
* Do an exp challenge.
*/
function doExpChallenge(message, character, challenger, currentTime){

	//Determine odds
	var levelDiff = character.level - challenger.level;
	var chance = 50 + Math.floor(levelDiff * 2.3) + (Math.floor(Math.random() * 2) - 1);
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
			calculateExpChallengeResults(message, character, challenger, chance,
				message.member.displayName, message.guild.members.get(challengerID).displayName,
				currentTime);
		}
		//Challenger wins
		else{

			calculateExpChallengeResults(message, challenger, character, 100 - chance,
				message.guild.members.get(challengerID).displayName, message.member.displayName,
				currentTime);
		}

		//Save battle results
		dbfunc.updateCharacter(character);
		dbfunc.updateCharacter(challenger);

		//Release challenge locks
		onChallenge = false;
		challengerID = null;
		opponentID = null;
		wagerType = null;
		wager = 0;
	}, 5000);
}

/**
* Do an gold challenge.
*/
function doGoldChallenge(message, character, challenger, currentTime){

	message.channel.send(message.member.displayName + " is facing off against challenger "
		+ message.guild.members.get(challengerID).displayName + " for " + wager + " gold!\n"
		+ "Gold challenges are 50/50 battles!\n"
		+ "The challenge has begun...\n");

	//Wait 5 seconds for challenge results
	setTimeout(function(){

		//Determine battle results
		var result = Math.floor(Math.random() * 100) + 1;

		//If challenger loses
		if(result <= 50){

			//Winner results
			calculateGoldChallengeResults(message, character, challenger,
				message.member.displayName, message.guild.members.get(challengerID).displayName,
				currentTime);
		}
		//Challenger wins
		else{

			calculateGoldChallengeResults(message, challenger, character,
				message.guild.members.get(challengerID).displayName, message.member.displayName,
				currentTime);
		}

		//Save battle results
		dbfunc.updateCharacter(character);
		dbfunc.updateCharacter(challenger);

		//Release challenge locks
		onChallenge = false;
		challengerID = null;
		opponentID = null;
		wagerType = null;
		wager = 0;
	}, 5000);
}

/**
* Calculate exp challenge results.
*/
function calculateExpChallengeResults(message, victor, loser, chance, victorName, loserName, currentTime){

	if(victor.challengesLeft == 3){

		victor.challengetime = currentTime;
	}
	if(loser.challengesLeft == 3){

		loser.challengetime = currentTime;
	}

	var exp = 0;

	//Winner reaults
	if(chance > 50){

		if((victor.level - loser.level) >= 20){

			exp = Math.ceil(wager * (15/chance));
		}
		else if((victor.level - loser.level) >= 15){

			exp = Math.ceil(wager * (25/chance));
		}
		else if((victor.level - loser.level) >= 9 && chance >= 70){

			exp = Math.ceil(wager * (37/chance));
		}
		else if((victor.level - loser.level) >= 5 && chance >= 60){

			exp = Math.ceil(wager * (46/chance));
		}
		else{

			exp = Math.ceil(wager * (50/chance));
		}
	}
	else{

		exp = Math.floor(wager * (Math.pow(1.154, ((50 - chance) / 4))));
	}
	var leftover = (exp + victor.experience) % 100;
	var gains = Math.floor(((exp + victor.experience)/100));
	var newLevel = victor.level + gains;

	charfunc.levelChange(victor, newLevel - victor.level);
	victor.level = newLevel;
	victor.experience = leftover;

	//Loser results
	var loserExp = ((loser.level - 1) * 100) + loser.experience - wager;
	var loserLeftover = loserExp % 100;
	var loserLevel = 1 + Math.floor(loserExp/100);

	charfunc.levelChange(loser, loserLevel - loser.level);
	loser.level = loserLevel;
	loser.experience = loserLeftover;

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
		+ loserName + " Lv" + loser.level + "  |  " + loser.experience + " EXP");
}

/**
* Calculate gold challenge results.
*/
function calculateGoldChallengeResults(message, victor, loser, victorName, loserName, currentTime){

	if(victor.challengesLeft == 3){

		victor.challengetime = currentTime;
	}
	if(loser.challengesLeft == 3){

		loser.challengetime = currentTime;
	}

	//Winner results
	victor.gold = victor.gold + (wager * 1);

	//Loser results
	loser.gold = loser.gold - (wager * 1);

	victor.challengesLeft -= 1;
	victor.challengeWins += 1;
	victor.challengeWinrate = Math.floor(((victor.challengeWins / (victor.challengeWins + victor.challengeLosses)) * 100));

	loser.challengesLeft -= 1;
	loser.challengeLosses += 1;
	loser.challengeWinrate = Math.floor(((loser.challengeWins / (loser.challengeWins + loser.challengeLosses)) * 100));

	message.channel.send("The challenge is over!\n"
		+ victorName + " is the winner! They earned " + wager + " gold!\n"
		+ victorName + " now has " + victor.gold + " gold\n"
		+ loserName + " now has "+ loser.gold + " gold");
}

/**
* Determines if x is an integer.
*/
function isInteger(x){

	return !isNaN(x) && (x % 1 === 0);
}
