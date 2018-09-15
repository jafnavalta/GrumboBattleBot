//Initialize DB functions
let dbfunc = require('../data/db.js');

//Initialize fs
const fs = require("fs");

//Class active helper
let classactivefunc = require('./class_active.js');

//List of actives
let activesList = JSON.parse(fs.readFileSync("./values/actives.json", "utf8"));

//For class level functions.
//ALL classes should have these.
exports.className = "Cleric";

exports.CLASS_LEVEL_MAX = 5;

//Actives
const LEVEL_1_ACTIVE = 'regen';
const LEVEL_3_ACTIVE = 'miracle';
const LEVEL_4_ACTIVE = 'holy';

const BASE_POW_EQ = -6;
const BASE_WIS_EQ = 2;
const BASE_DEF_EQ = -6;
const BASE_RES_EQ = 7;
const BASE_SPD_EQ = 3;
const BASE_LUK_EQ = 0;

exports.BASE_POW_EQ = BASE_POW_EQ;
exports.BASE_WIS_EQ = BASE_WIS_EQ;
exports.BASE_DEF_EQ = BASE_DEF_EQ;
exports.BASE_RES_EQ = BASE_RES_EQ;
exports.BASE_SPD_EQ = BASE_SPD_EQ;
exports.BASE_LUK_EQ = BASE_LUK_EQ;

exports.powX = 0.78;
exports.wisX = 1.16;
exports.defX = 0.75;
exports.resX = 1.4;
exports.spdX = 1;
exports.lukX = 1;

exports.levelUp = {};
exports.setClassLevelFunc = {};
exports.removeClassLevelFunc = {};

//////////////////////////////
// CLASS LEVEL UP FUNCTIONS // //Typically, anything permanent followed by accompanying setClassLevelFunc.
//////////////////////////////
exports.levelUp.cleric1 = function(character){

  exports.setClassLevelFunc.cleric1(character);
  character.resMod += 1;
}

exports.levelUp.cleric2 = function(character){

  exports.setClassLevelFunc.cleric2(character);
  character.resMod += 1;
}

exports.levelUp.cleric3 = function(character){

  exports.setClassLevelFunc.cleric3(character);
  character.resMod += 1;
}

exports.levelUp.cleric4 = function(character){

  exports.setClassLevelFunc.cleric4(character);
  character.resMod += 1;
}

exports.levelUp.cleric5 = function(character){

  exports.setClassLevelFunc.cleric5(character);
  character.resMod += 1;
}

exports.levelUp.cleric6 = function(character){

  exports.setClassLevelFunc.cleric6(character);
  character.resMod += 1;
}

exports.levelUp.cleric7 = function(character){

  exports.setClassLevelFunc.cleric7(character);
  character.resMod += 1;
}

exports.levelUp.cleric8 = function(character){

  exports.setClassLevelFunc.cleric8(character);
  character.resMod += 1;
}

exports.levelUp.cleric9 = function(character){

  exports.setClassLevelFunc.cleric9(character);
  character.resMod += 1;
}

exports.levelUp.cleric10 = function(character){

  exports.setClassLevelFunc.cleric10(character);
  character.resMod += 1;
}

/////////////////////////////// Set class level mods
// SET CLASS LEVEL FUNCTIONS // Set class level actives
/////////////////////////////// Set class level skills (NOT IMPLEMENTED YET)
exports.setClassLevelFunc.cleric1 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_1_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
}

exports.setClassLevelFunc.cleric2 = function(character){

  character.resEq += 3;
}

exports.setClassLevelFunc.cleric3 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_3_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
}

exports.setClassLevelFunc.cleric4 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_4_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
}

exports.setClassLevelFunc.cleric5 = function(character){

  character.resEq += 1;
  character.wisEq += 8;
}

exports.setClassLevelFunc.cleric6 = function(character){

}

exports.setClassLevelFunc.cleric7 = function(character){

}

exports.setClassLevelFunc.cleric8 = function(character){

}

exports.setClassLevelFunc.cleric9 = function(character){

}

exports.setClassLevelFunc.cleric10 = function(character){

}

////////////////////////////////// Remove class level mods (equips are removed in class.js)
// REMOVE CLASS LEVEL FUNCTIONS // Remove class level actives
////////////////////////////////// Remove class level skills
exports.removeClassLevelFunc.cleric1 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_1_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
}

exports.removeClassLevelFunc.cleric2 = function(character){

  character.resEq -= 3;
}

exports.removeClassLevelFunc.cleric3 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_3_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
}

exports.removeClassLevelFunc.cleric4 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_4_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
}

exports.removeClassLevelFunc.cleric5 = function(character){

  character.resEq -= 1;
  character.wisEq -= 8;
}

exports.removeClassLevelFunc.cleric6 = function(character){

}

exports.removeClassLevelFunc.cleric7 = function(character){

}

exports.removeClassLevelFunc.cleric8 = function(character){

}

exports.removeClassLevelFunc.cleric9 = function(character){

}

exports.removeClassLevelFunc.cleric10 = function(character){

}
