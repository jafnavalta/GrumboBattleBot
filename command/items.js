//Initialize fs
const fs = require("fs");

//Initialize list of items file
let itemList = JSON.parse(fs.readFileSync("./values/items.json", "utf8"));

//Initialize state for state constants and functions
let state = require('../state.js');

exports.commandItems = function(levels, message, args, character){
	
	//Display list of items
	if(args.length == 2 || (args.length == 3 && args[2] == 'display')){
		
		//DM user
		var sender = message.author;
		if(args.length == 3){
			
			//Message channel
			sender = message.channel;
		}
		
		var items = character.items;
		if(items.length == 0){
			
			sender.send("You have no items " + message.member.displayName + "!");
		}
		else{
			
			var itemsString = message.member.displayName + "'s items\n\n";
			var unique = [...new Set(items)];
			unique.forEach(function(item){
				
				//Count how much the user has of that particular item
				var count = 0;
				for(var i = 0; i < items.length; ++i){
					
					if(items[i] == item) count++;
				}
				
				var details = itemList[item];
				if(details.max > 1){
					
					itemsString += count + "/" + details.max + "  " + details.name + "  |  Command:  " + item + "\n";
				}
				else{
					
					itemsString += details.name + "\n";
				}
			});
			
			sender.send(itemsString);
		}
	}
	
	//Check item details
	else if(args[2] == 'details' && (args.length == 4 || (args.length == 5 && args[4] == 'display'))){
		
		//DM user
		var sender = message.author;
		if(args.length == 5){
			
			//Message channel
			sender = message.channel;
		}
		
		var item = args[3];
		var details = itemList[item];
		if(details != null){
			
			//TODO display details of item
			detailsString = details.name + "  |  Command:  " + item + "\n"
				+ details.description + "\n"
				+ "Sell: " + details.value + " gold\n";
			if(details.max > 1){
				
				detailsString += "Can hold up to " + details.max;
			}
			else{
				
				detailsString += "This is a unique item";
			}
			sender.send(detailsString);
		}
		else{
			
			//Item doesn't exist
			sender.send(item + " does not exist.");
		}
	}
	
	//Use an item
	else if(args.length == 4 && args[2] == 'use'){
		
		var item = args[3];
		if(character.items.includes(item)){
			
			//Determine item type
			var details = itemList[item];
			switch(details.type){
				
				case state.IMMEDIATE:
				
					state.immediate(levels, message, character, item, details.name);
					break;
					
				case state.CONSUME:
				
					state.consume(levels, message, character, item, details.name, details.battleState);
					break;
					
				case state.NONCONSUME:
				
					state.nonconsume(levels, message, character, item, details.name);
					break;
					
				case state.TOGGLE:
				
					state.toggle(levels, message, character, item, details.name, details.battleState);
					break;
					
				default:
					//Do nothing
					break;
			}
		}
		else{
			
			message.channel.send("You do not have the item " + item);
		}
	}
	
	//Bad command
	else{
		
		message.channel.send("Bad item command. Try '!grumbo help' for the correct command.");
	}
}