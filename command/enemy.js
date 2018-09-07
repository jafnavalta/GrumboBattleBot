//Initialize DB functions
let dbfunc = require('../data/db.js');

//Initialize list of actives
const fs = require("fs");
let grumbosList = JSON.parse(fs.readFileSync("./values/grumbos.json", "utf8"));

/**
* Display list of current active effects.
*/
exports.commandEnemy = function(character, message, args){
	
	if(args.length == 3 || (args.length == 4 && args[3] == '-d')){
		
		//DM user
		var sender = message.author;
		if(args.length == 4){
			
			//Message channel
			sender = message.channel;
		}
		
		var grumbo = args[2];
		var details = grumbosList[grumbo];
		if(details != null){
			
			detailsString = details.name + "\n" + details.description + "\n";
			sender.send(detailsString);
		}
		else{
			
			//Active doesn't exist
			sender.send(grumbo + " does not exist.");
		}
	}
	
	//Bad command
	else{
		
		message.channel.send("Bad enemy command. Try '!grumbo help' for the correct command.");
	}
}