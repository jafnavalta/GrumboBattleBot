//Initialize fs
const fs = require("fs");

//Initialize list of items file
let itemList = JSON.parse(fs.readFileSync("./values/items.json", "utf8"));

//Initialize state for state constants and functions
let state = require('../state/state.js');

exports.commandItems = function(message, args, character){

	//Display list of items
	if(args.length == 2 || (args.length == 3 && args[2] == '-d')){

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

			var itemsString = message.member.displayName + "'s Items\n\n";
			var unique = [...new Set(items)];
			unique.forEach(function(item){

				//Count how much the user has of that particular item
				var count = 0;
				for(var i = 0; i < items.length; ++i){

					if(items[i] == item) count++;
				}

				var details = itemList[item];
				if(itemsString.length >= 1500){

					sender.send(itemsString);
					itemsString = "";
				}
				if(details.max > 1){

					itemsString += count + "/" + details.max + "  " + details.name + "  |  Command:  " + item + "\n";
				}
				else{

					itemsString += details.name + "  |  Command:  " + item + "\n";
				}
			});

			sender.send(itemsString);
		}
	}

	//Check item info
	else if(args[2] == 'info' && (args.length == 4 || (args.length == 5 && args[4] == '-d'))){

		//DM user
		var sender = message.author;
		if(args.length == 5){

			//Message channel
			sender = message.channel;
		}

		var item = args[3];
		var details = itemList[item];
		if(details != null){

			detailsString = details.name + "  |  Command:  " + item + "\n"
				+ details.description + "\n";
			detailsString += "Sell: " + details.value + " gold  |  ";
			if(details.max > 1){

				detailsString += "Can hold up to " + details.max + "\n";
			}
			else{

				detailsString += "Can only hold 1\n";
			}

			sender.send(detailsString);
		}
		else{

			//Item doesn't exist
			sender.send(item + " does not exist.");
		}
	}

	//Use an item
	else if(args[2] == 'use' && (args.length == 4 || (args.length == 5 && isInteger(args[4])))){

		var item = args[3];
		var amount = 1;
		var hasEnough = character.items.includes(item);
		if(args.length == 5 && hasEnough){

			amount = args[4] * 1;
			//Count how much the user has of that particular item
			var count = 0;
			for(var i = 0; i < character.items.length; ++i){

				if(character.items[i] == item) count++;
			}
			if(amount > count) hasEnough = false;
		}

		var details = itemList[item];
		if(hasEnough){

			//Use item
			state[details.type](message, character, item, details, amount);
		}
		else if(details == null){

			message.channel.send(item + " does not exist.");
		}
		else{

			message.channel.send("You do not have enough of the item: " + details.name);
		}
	}

	//Bad command
	else{

		message.channel.send("Bad item command. Try '!grumbo help' for the correct command.");
	}
}

/**
* Determines if x is an integer.
*/
function isInteger(x){

	return !isNaN(x) && (x % 1 === 0);
}
