//Initialize DB functions
let dbfunc = require('../data/db.js');

//Class functions
let classfunc = require('../character/class.js');
let classesjs = require('../character/classes.js').classes;

//Initialize list of classes
const fs = require("fs");
let classList = JSON.parse(fs.readFileSync("./values/classes.json", "utf8"));

/**
* Class commands.
*/
exports.commandClass = function(character, message, args){

	//Display your class progression
	if(args.length == 2 || (args.length == 3 && args[2] == '-d')){

		//DM user
		var sender = message.author;
		if(args.length == 3){

			//Message channel
			sender = message.channel;
		}

		//Get character class progression
		dbfunc.getDB().collection("classes").find({"character": character._id}).toArray(function(err, classes){

      var classString = "Your current class is " + classesjs[character.classId].className + "  Lv" + character.classLevel + "  EXP " + character.classExp + "\n\n";
      if(classes != null){

        //Sort based on level first, then experience
  			classes.sort(function(a, b){
  				var keyA = a.classLevel,
  					keyB = b.classLevel,
  					xpA = a.classExp,
  					xpB = b.classExp;

          //Compare class progression
  				if(keyA < keyB) return 1;
  				if(keyA > keyB) return -1;
  				if(xpA < xpB) return 1;
  				if(xpA > xpB) return -1;
  				return 0;
  			});
        for(var i = 0; i < classes.length; i++){

          var classObj = classes[i];
          if(classList[classObj.classId] != null){

            classString += classList[classObj.classId].className + " Lv" + classObj.classLevel + "  EXP " + classObj.classExp + "  |  Command: " + classObj.classId + "\n";
          }
        }
        for(var key in classList){

          var classListObj = classList[key];
          var hasClass = false;
          classes.forEach(function(classesObj){

            if(classesObj.classId == classListObj.classId){

              hasClass = true;
            }
          });
          if(!hasClass){

            classString += classListObj.className + " Lv 0  EXP 0  |  Command: " + classListObj.classId + "\n";
          }
        };

        sender.send(classString);
      }
		});
	}

  //Class change
  else if(args[2] == 'change' && args.length == 4){

    classfunc.classChange(message, args, character);
  }

	//Check class info
	else if(args[2] == 'info' && (args.length == 4 || (args.length == 5 && args[4] == '-d'))){

		//DM user
		var sender = message.author;
		if(args.length == 5){

			//Message channel
			sender = message.channel;
		}

		var classId = args[3];
		var details = classList[classId]
		if(details != null){

			detailsString = details.className + "\n" + details.description + "\n"
        + "POW  " + details.pow + "  |  WIS  " + details.wis + "\n"
        + "DEF    " + details.def + "  |  RES  " + details.res + "\n"
        + "SPD    " + details.spd + "  |  LUK  " + details.luk + "\n\n";

				detailsString += "Max Lv:  " + classesjs[classId].CLASS_LEVEL_MAX + "\n";
      for(var i = 0; i < details.perks.length; i++){

        var level = i + 1;
        detailsString += "Lv " + level + ":  " + details.perks[i] + "\n";
      }

			sender.send(detailsString);
		}
		else{

			//Class doesn't exist
			sender.send(classId + " is not a valid class.");
		}
	}

	//Bad command
	else{

		message.channel.send("Bad class command. Try '!grumbo help' for the correct command.");
	}
}
