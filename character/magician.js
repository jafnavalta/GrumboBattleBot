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
exports.className = "Magician";

exports.CLASS_LEVEL_MAX = 7;

//Actives
const LEVEL_1_ACTIVE = 'outsmart';
const LEVEL_3_ACTIVE = 'rune_cast';
const LEVEL_4_ACTIVE = 'explosion';
const LEVEL_5_ACTIVE = 'barrier';
const LEVEL_7_ACTIVE = 'multi_cast';

const BASE_HP_EQ = 0;
const BASE_POW_EQ = -5;
const BASE_WIS_EQ = 6;
const BASE_SKL_EQ = 0;
const BASE_DEF_EQ = -5;
const BASE_RES_EQ = 2;
const BASE_SPD_EQ = 0;
const BASE_LUK_EQ = 0;
const BASE_TURN_EQ = 0;
const BASE_AGGRO_EQ = 0;

exports.BASE_HP_EQ = BASE_HP_EQ;
exports.BASE_POW_EQ = BASE_POW_EQ;
exports.BASE_WIS_EQ = BASE_WIS_EQ;
exports.BASE_SKL_EQ = BASE_SKL_EQ;
exports.BASE_DEF_EQ = BASE_DEF_EQ;
exports.BASE_RES_EQ = BASE_RES_EQ;
exports.BASE_SPD_EQ = BASE_SPD_EQ;
exports.BASE_LUK_EQ = BASE_LUK_EQ;
exports.BASE_TURN_EQ = BASE_TURN_EQ;
exports.BASE_AGGRO_EQ = BASE_AGGRO_EQ;

exports.hpX = 0.86;
exports.powX = 0.84;
exports.wisX = 1.34;
exports.sklX = 1.02;
exports.defX = 0.79;
exports.resX = 1.1;
exports.spdX = 1;
exports.lukX = 1;

exports.levelUp = {};
exports.setClassLevelFunc = {};
exports.removeClassLevelFunc = {};

//////////////////////////////
// CLASS LEVEL UP FUNCTIONS // //Typically, anything permanent followed by accompanying setClassLevelFunc.
//////////////////////////////
exports.levelUp.magician1 = function(character){

  exports.setClassLevelFunc.magician1(character);
  character.wisMod += 2;
}

exports.levelUp.magician2 = function(character){

  exports.setClassLevelFunc.magician2(character);
  character.wisMod += 2;
}

exports.levelUp.magician3 = function(character){

  exports.setClassLevelFunc.magician3(character);
  character.wisMod += 2;
}

exports.levelUp.magician4 = function(character){

  exports.setClassLevelFunc.magician4(character);
  character.wisMod += 2;
}

exports.levelUp.magician5 = function(character){

  exports.setClassLevelFunc.magician5(character);
  character.wisMod += 2;
}

exports.levelUp.magician6 = function(character){

  exports.setClassLevelFunc.magician6(character);
  character.wisMod += 2;
}

exports.levelUp.magician7 = function(character){

  exports.setClassLevelFunc.magician7(character);
  character.wisMod += 2;
}

exports.levelUp.magician8 = function(character){

  exports.setClassLevelFunc.magician8(character);
  character.wisMod += 2;
}

exports.levelUp.magician9 = function(character){

  exports.setClassLevelFunc.magician9(character);
  character.wisMod += 2;
}

exports.levelUp.magician10 = function(character){

  exports.setClassLevelFunc.magician10(character);
  character.wisMod += 2;
}

/////////////////////////////// Set class level mods
// SET CLASS LEVEL FUNCTIONS // Set class level actives
/////////////////////////////// Set class level skills (NOT IMPLEMENTED YET)
exports.setClassLevelFunc.magician1 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_1_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
}

exports.setClassLevelFunc.magician2 = function(character){

  character.wisEq += 15;
}

exports.setClassLevelFunc.magician3 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_3_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
  character.wisEq += 6;
  character.resEq += 2;
}

exports.setClassLevelFunc.magician4 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_4_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
}

exports.setClassLevelFunc.magician5 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_5_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
}

exports.setClassLevelFunc.magician6 = function(character){

  character.wisEq += 8;
  character.sklEq += 2;
}

exports.setClassLevelFunc.magician7 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_7_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
  character.wisEq += 5;
  character.defEq += 2;
}

exports.setClassLevelFunc.magician8 = function(character){

}

exports.setClassLevelFunc.magician9 = function(character){

}

exports.setClassLevelFunc.magician10 = function(character){

}

////////////////////////////////// Remove class level mods (equips are removed in class.js)
// REMOVE CLASS LEVEL FUNCTIONS // Remove class level actives
////////////////////////////////// Remove class level skills
exports.removeClassLevelFunc.magician1 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_1_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
}

exports.removeClassLevelFunc.magician2 = function(character){

  character.wisEq -= 15;
}

exports.removeClassLevelFunc.magician3 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_3_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
  character.wisEq -= 6;
  character.resEq -= 2;
}

exports.removeClassLevelFunc.magician4 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_4_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
}

exports.removeClassLevelFunc.magician5 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_5_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
}

exports.removeClassLevelFunc.magician6 = function(character){

  character.wisEq -= 8;
  character.sklEq -= 2;
}

exports.removeClassLevelFunc.magician7 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_7_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
  character.wisEq -= 5;
  character.defEq -= 2;
}

exports.removeClassLevelFunc.magician8 = function(character){

}

exports.removeClassLevelFunc.magician9 = function(character){

}

exports.removeClassLevelFunc.magician10 = function(character){

}
