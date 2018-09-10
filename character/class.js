//Initialize DB functions
let dbfunc = require('../data/db.js');

//Initialize fs
const fs = require("fs");

//Initialize list of equips file
let equipList = JSON.parse(fs.readFileSync("./values/equips.json", "utf8"));

//Initialize class functions
let classes = require('./classes.js').classes;

//Character/state functions
let charfunc = require('./character.js');
let state = require('../state.js');

const CLASS_EXP_TO_LEVEL = 25;
const CLASS_CHANGE_WAIT_TIME = 43200000; //12 hours

exports.CLASS_CHANGE_WAIT_TIME = CLASS_CHANGE_WAIT_TIME;

/**
* Change classes.
* Check if valid class and not same class
* Remove current class actives, mods, skills, class specific equips.
* NO NEED TO SAVE CURRENT CLASS, IT SHOULD BE SAVED IN OTHER FUNCTIONS WHENEVER IT UPDATES
* Get new class for character from DB
* If doesn't exist, set to classObj to classLevel 0 and classExp 0, never used this class before.
* Set new class actives, mods, skills based on level.
* Calculate stats last.
* If class change successful, set new classTime
* NO NEED TO SAVE NEW CLASS EITHER, NEW CLASSES SAVED IN SETCLASS METHOD.
* Save character in DB.
*/
exports.classChange = function(message, args, character){

  var newClass = args[3]; //!grumbo class change newClass
  var classfunc = classes[newClass];
  if(classfunc != null && character.classId != newClass){

    var date = new Date();
    var currentTime = date.getTime();
    var timeSinceLastChange = currentTime - character.classTime;
    if(timeSinceLastChange/CLASS_CHANGE_WAIT_TIME >= 1){

      dbfunc.getDB().collection("classes").findOne({"_id": character._id + newClass}, function(err, classObj){

        var classFromDB = classObj;
        if(classFromDB == null){

          //If you've never been this class, initialize it
          classFromDB = {
              _id: character._id + newClass,
              character: character._id,
              classId: newClass,
              classLevel: 0,
              classExp: 0
          }
        }

        removeClass(message, character);
        setClass(character, classFromDB, newClass);
        charfunc.calculateStats(character);
        character.classTime = currentTime;
        dbfunc.updateCharacter(character);

        message.channel.send(message.member.displayName + " class changed to " + classfunc.className + "!");
      });
    }
    else{

      //Class changed too recently
    	var hours = Math.floor((CLASS_CHANGE_WAIT_TIME - timeSinceLastChange)/3600000);
    	var minutes = Math.ceil(((CLASS_CHANGE_WAIT_TIME - timeSinceLastChange) % 3600000) / 60000);
      message.channel.send("You've class changed too recently " + message.member.displayName + "!"
        + "\nYou can class change again in " + hours + " hours " + minutes + " minutes");
    }
  }
  else{

    message.channel.send(newClass + " is not a valid class change option!");
  }
}

/**
* Level up class based on current classExp. This also increments classLevel, the battle does not do it.
* This should be called regardless if a level up would occur or not to save class details.
*/
exports.levelUpClass = function(character, state){

  if(character.classLevel >= classes[character.classId].CLASS_LEVEL_MAX && character.classExp >= CLASS_EXP_TO_LEVEL){

    character.classLevel = classes[character.classId].CLASS_LEVEL_MAX;
    character.classExp = CLASS_EXP_TO_LEVEL;
  }
  else if(character.classExp >= CLASS_EXP_TO_LEVEL && character.classLevel < classes[character.classId].CLASS_LEVEL_MAX){

    character.classLevel += 1;
    character.classExp = 0;
    var classfunc = classes[character.classId];
    var functionId = character.classId + character.classLevel;
    classfunc.levelUp[functionId](character);
    charfunc.calculateStats(character);

    if(state != null){

      //Push level up to endMessages of state from where this is coming from.
      state.endMessages.push("Your " + classfunc.className + " class is now level " + character.classLevel + "!");
    }
  }

  //Save class to DB
  var classRow = {
    _id: character._id + character.classId,
    character: character._id,
    classId: character.classId,
    classLevel: character.classLevel,
    classExp: character.classExp
  }
  dbfunc.updateClass(classRow);
}

/**
* Set class.
* If classLevel is 0, level up to 1, save class to DB.
* Set character.classId, character.classLevel, character.classExp.
* Set class actives, mods, skills based using setClassLevelFunc.
*/
function setClass(character, classFromDB, newClass){

  var classfunc = classes[newClass];
  character.classId = newClass;
  character.classLevel = classFromDB.classLevel;
  character.classExp = classFromDB.classExp;
  character.powEq += classfunc.BASE_POW_EQ;
  character.wisEq += classfunc.BASE_WIS_EQ;
  character.defEq += classfunc.BASE_DEF_EQ;
  character.resEq += classfunc.BASE_RES_EQ;
  character.spdEq += classfunc.BASE_SPD_EQ;
  character.lukEq += classfunc.BASE_LUK_EQ;

  //If classLevel is 0, level up to 1
  if(character.classLevel <= 0){

    character.classExp = CLASS_EXP_TO_LEVEL;
    exports.levelUpClass(character, null);

    //Save class to DB
    var classRow = {
      _id: character._id + newClass,
      character: character._id,
      classId: newClass,
      classLevel: character.classLevel,
      classExp: character.classExp
    }
    dbfunc.updateClass(classRow);
  }
  else{

    //Start at level 1
    for(var i = 1; i <= character.classLevel; i++){

        var functionId = character.classId + i;
        if(classfunc.setClassLevelFunc[functionId] != null){

          classfunc.setClassLevelFunc[functionId](character);
        }
    }
  }
}

/**
* Remove class.
* Set character.classId, character.classLevel, character.classExp.
* Set class actives, mods, skills based using setClassLevelFunc.
*/
function removeClass(message, character){

  var classfunc = classes[character.classId];
  character.powEq -= classfunc.BASE_POW_EQ;
  character.wisEq -= classfunc.BASE_WIS_EQ;
  character.defEq -= classfunc.BASE_DEF_EQ;
  character.resEq -= classfunc.BASE_RES_EQ;
  character.spdEq -= classfunc.BASE_SPD_EQ;
  character.lukEq -= classfunc.BASE_LUK_EQ;
  removeClassEquips(message, character);

  //Start at level 1
  for(var i = 1; i <= character.classLevel; i++){

      var functionId = character.classId + i;
      if(classfunc.removeClassLevelFunc[functionId] != null){

        classfunc.removeClassLevelFunc[functionId](character);
      }
  }
}

/**
* Remove class specific equips of current class.
*/
function removeClassEquips(message, character){

  var head = equipList[character.head];
  var armor = equipList[character.armor];
  var bottom = equipList[character.bottom];
  var weapon = equipList[character.weapon];
  if(head != null){

    if(head.classId == character.classId){

      state.unequip(message, character, head);
    }
  }
  if(armor != null){

    if(armor.classId == character.classId){

      state.unequip(message, character, armor);
    }
  }
  if(bottom != null){

    if(bottom.classId == character.classId){

      state.unequip(message, character, bottom);
    }
  }
  if(weapon != null){

    if(weapon.classId == character.classId){

      state.unequip(message, character, weapon);
    }
  }
}
