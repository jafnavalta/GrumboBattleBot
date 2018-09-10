//Initialize DB functions
let dbfunc = require('../data/db.js');

//Initialize list of actives
const fs = require("fs");
let activesList = JSON.parse(fs.readFileSync("./values/actives.json", "utf8"));

/**
* Display list of current active effects.
*/
exports.commandActives = function(character, message, args){

	//Display list of actives
	if(args.length == 2 || (args.length == 3 && args[2] == '-d')){

		//DM user
		var sender = message.author;
		if(args.length == 3){

			//Message channel
			sender = message.channel;
		}

		var noActives = true;

		//Get character
		dbfunc.getDB().collection("actives").find({"character": character._id}).toArray(function(err, actives){

			if(actives.length == 0 || actives == null){

				sender.send("You have no active effects " + message.member.displayName + "!");
			}
			else{

				var activeString = message.member.displayName + "'s active effects\n\n";
				actives.forEach(function(activeObj){

					activeString += activeObj.name;
					if(activeObj.duration != null && activeObj.duration > 0){

						activeString += "  |  " + activeObj.duration + " battle(s)";
					}
					activeString += "  |  Command: " + activeObj.id + "\n";
				});

				sender.send(activeString);
			}
		});
	}

	//Check active info
	else if(args[2] == 'info' && (args.length == 4 || (args.length == 5 && args[4] == '-d'))){

		//DM user
		var sender = message.author;
		if(args.length == 5){

			//Message channel
			sender = message.channel;
		}

		var active = args[3];
		var details = activesList[active];
		if(details != null){

			detailsString = details.name + "\n" + details.description + "\n";
			sender.send(detailsString);
		}
		else{

			//Active doesn't exist
			sender.send(active + " does not exist.");
		}
	}

	//Bad command
	else{

		message.channel.send("Bad active command. Try '!grumbo help' for the correct command.");
	}
}
