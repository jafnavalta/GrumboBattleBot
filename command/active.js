//Initialize list of items, effects, etc.
const fs = require("fs");
let itemList = JSON.parse(fs.readFileSync("./values/items.json", "utf8"));

/**
* Display list of current active effects.
*/
exports.commandActive = function(character, message, args){
	
	if(args.length == 2 || (args.length == 3 && args[2] == 'display')){
	
		//DM user
		var sender = message.author;
		if(args.length == 3){
			
			//Message channel
			sender = message.channel;
		}
		
		if(character.active.length == 0){
			
			sender.send("You have no active effects " + message.member.displayName + "!");
		}
		else{
			
			var activeString = message.member.displayName + "'s active effects\n\n";
			character.active.forEach(function(effect){
				
				if(itemList[effect] != undefined){
					
					activeString += itemList[effect].name + "\n";
				}
				//TODO else if effect, equip, etc. != undefined
			})
			
			sender.send(activeString);
		}
	}
	else{
		
		message.channel.send("Bad active command. Try '!grumbo help' for the correct command.");
	}
}