//Initialize DB functions
let dbfunc = require('../data/db.js');

//Initialize fs
const fs = require("fs");

//Initialize list of equips file
let equipList = JSON.parse(fs.readFileSync("./values/equips.json", "utf8"));
let activeList = JSON.parse(fs.readFileSync("./values/actives.json", "utf8"));

//Initialize state for state constants and functions
let state = require('../state/state.js');

//Classes
let classes = require('../character/classes.js').classes;

exports.commandEquip = function(message, args, character){

	//Display list of equips
	if(args[1] == 'equip' && (args.length == 2 || (args.length == 3 && args[2] == '-d'))){

		//DM user
		var sender = message.author;
		if(args.length == 3){

			//Message channel
			sender = message.channel;
		}

		var equips = character.equips;
		if(equips.length == 0){

			sender.send("You have no equips " + message.member.displayName + "!");
		}
		else{

			var equipsString = message.member.displayName + "'s Equips\n";

      var head = equipList[character.head];
  		if(head != null) head = head.name;
  		else head = "-----";
  		var armor = equipList[character.armor];
  		if(armor != null) armor = armor.name;
  		else armor = "-----";
  		var bottom = equipList[character.bottom];
  		if(bottom != null) bottom = bottom.name;
  		else bottom = "-----";
  		var weapon = equipList[character.weapon];
  		if(weapon != null) weapon = weapon.name;
  		else weapon = "-----";
      equipsString += "\nHead: " + head;
      equipsString += "\nArmor: " + armor;
      equipsString += "\nBottom: " + bottom;
      equipsString += "\nWeapon: " + weapon + "\n\n";

      character.equips.forEach(function(equip){

        var equipObj = equipList[equip];
        var equipClassName;
        if(equipObj.classId == null) {

          equipClassName = "All";
        }
        else{

          equipClassName = classes[equipObj.classId].className;
        }
				if(equipsString.length >= 1500){

					sender.send(equipsString);
					equipsString = "";
				}
        equipsString += equipObj.name + "  |  Lv Req:  " + equipObj.level + "  |  Type: " + equipObj.type.charAt(0).toUpperCase() + equipObj.type.substr(1) + "  |  Class: " + equipClassName + "  |  Command: " + equipObj.id + "\n";
      });

			sender.send(equipsString);
		}
	}

	//Check equip info
	else if(args[1] == 'equip' && (args[2] == 'info' && (args.length == 4 || (args.length == 5 && args[4] == '-d')))){

		//DM user
		var sender = message.author;
		if(args.length == 5){

			//Message channel
			sender = message.channel;
		}

		var equip = args[3];
		var details = equipList[equip];
		if(details != null){

      var detailsString = details.name + "  |  Lv Req:  " + details.level + "  |  Command: " + details.id + "\n"
        + details.description + "\nActive: ";
			var activeString;
			if(details.active == null) activeString = "None\n";
			else activeString = activeList[details.active].name + "\n";
			detailsString += activeString;
      detailsString += "Sell: " + details.value + " gold";
			sender.send(detailsString);
		}
		else{

			//Equip doesn't exist
			sender.send(equip + " does not exist.");
		}
	}

	//Equip
	else if(args[1] == 'equip' && args.length == 3){

		var equip = args[2];

		var details = equipList[equip];
		if(character.equips.includes(equip)){

      if(character[details.type] != equip){

				if(details.level <= character.level){

	        if(details.classId == null || details.classId == character.classId){

	          if(character[details.type].length != 0){

	            //Unequip current equip
	            var equipped = equipList[character[details.type]];
	            state.unequip(message, character, equipped);
	          }

	          //Equip and save characters
	          state.equip(message, character, details);
	          dbfunc.updateCharacter(character);
	        }
	        else{

	          message.channel.send(message.member.displayName + ", you are not the correct class to equip " + details.name);
	        }
				}
				else{

					message.channel.send(message.member.displayName + ", you are not a high enough level to equip " + details.name);
				}
      }
      else{

        message.channel.send(details.name + " is already equipped " + message.member.displayName + "!");
      }
		}
		else if(details == null){

			message.channel.send(equip + " does not exist.");
		}
		else{

			message.channel.send("You do not own " + details.name);
		}
	}

  //Unequip
	else if(args[1] == 'unequip' && args.length == 3){

		var unequip = args[2];

		var details = equipList[unequip];
		if(character.equips.includes(unequip)){

      if(character[details.type] == unequip){

        //Unequip and save character
        state.unequip(message, character, details);
        dbfunc.updateCharacter(character);
      }
      else{

        message.channel.send(unequip + " is not currently equipped " + message.member.displayName + "!");
      }
		}
		else if(details == null){

			message.channel.send(unequip + " does not exist.");
		}
		else{

			message.channel.send("You do not own " + details.name);
		}
	}

	//Bad command
	else{

		message.channel.send("Bad equip command. Try '!grumbo help' for the correct command.");
	}
}
