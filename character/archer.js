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
exports.className = "Archer";

exports.CLASS_LEVEL_MAX = 7;

//Actives
const LEVEL_1_ACTIVE = 'roll';
const LEVEL_3_ACTIVE = 'sureshot';
const LEVEL_4_ACTIVE = 'mark';
const LEVEL_5_ACTIVE = 'headshot';
const LEVEL_7_ACTIVE = 'pierce';

const BASE_HP_EQ = -1;
const BASE_POW_EQ = 2;
const BASE_WIS_EQ = -2;
const BASE_SKL_EQ = 5;
const BASE_DEF_EQ = -1;
const BASE_RES_EQ = 0;
const BASE_SPD_EQ = 2;
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

exports.hpX = 0.93;
exports.powX = 0.92;
exports.wisX = 0.88;
exports.sklX = 1.30;
exports.defX = 0.81;
exports.resX = 1;
exports.spdX = 1;
exports.lukX = 1;

exports.levelUp = {};
exports.setClassLevelFunc = {};
exports.removeClassLevelFunc = {};

//////////////////////////////
// CLASS LEVEL UP FUNCTIONS // Typically, anything permanent followed by accompanying setClassLevelFunc.
//////////////////////////////
exports.levelUp.archer1 = function(character){

  exports.setClassLevelFunc.archer1(character);
  character.sklMod += 1;
}

exports.levelUp.archer2 = function(character){

  exports.setClassLevelFunc.archer2(character);
  character.sklMod += 2;
}

exports.levelUp.archer3 = function(character){

  exports.setClassLevelFunc.archer3(character);
  character.sklMod += 1;
}

exports.levelUp.archer4 = function(character){

  exports.setClassLevelFunc.archer4(character);
  character.sklMod += 2;
}

exports.levelUp.archer5 = function(character){

  exports.setClassLevelFunc.archer5(character);
  character.sklMod += 1;
}

exports.levelUp.archer6 = function(character){

  exports.setClassLevelFunc.archer6(character);
  character.sklMod += 2;
}

exports.levelUp.archer7 = function(character){

  exports.setClassLevelFunc.archer7(character);
  character.sklMod += 1;
}

exports.levelUp.archer8 = function(character){

  exports.setClassLevelFunc.archer8(character);
  character.sklMod += 2;
}

exports.levelUp.archer9 = function(character){

  exports.setClassLevelFunc.archer9(character);
  character.sklMod += 1;
}

exports.levelUp.archer10 = function(character){

  exports.setClassLevelFunc.archer10(character);
  character.sklMod += 2;
}

///////////////////////////////
// SET CLASS LEVEL FUNCTIONS //
///////////////////////////////
exports.setClassLevelFunc.archer1 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_1_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
}

exports.setClassLevelFunc.archer2 = function(character){

  character.powEq += 5;
  character.sklEq += 2;
  character.spdEq += 1;
}

exports.setClassLevelFunc.archer3 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_3_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
}

exports.setClassLevelFunc.archer4 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_4_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
  character.defEq += 2;
  character.sklEq += 2;
  character.spdEq += 1;
}

exports.setClassLevelFunc.archer5 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_5_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
}

exports.setClassLevelFunc.archer6 = function(character){

  character.powEq += 5;
  character.sklEq += 1;
  character.lukEq += 1;
  character.resEq += 1;
}

exports.setClassLevelFunc.archer7 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_7_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
  character.sklEq += 2;
  character.spdEq += 1;
}

exports.setClassLevelFunc.archer8 = function(character){

}

exports.setClassLevelFunc.archer9 = function(character){

}

exports.setClassLevelFunc.archer10 = function(character){

}

////////////////////////////////// Remove class level mods (equips are removed in class.js)
// REMOVE CLASS LEVEL FUNCTIONS // Remove class level actives
////////////////////////////////// Remove class level skills
exports.removeClassLevelFunc.archer1 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_1_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
}

exports.removeClassLevelFunc.archer2 = function(character){

  character.powEq -= 5;
  character.sklEq -= 2;
  character.spdEq -= 1;
}

exports.removeClassLevelFunc.archer3 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_3_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
}

exports.removeClassLevelFunc.archer4 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_4_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
  character.defEq -= 2;
  character.sklEq -= 2;
  character.spdEq -= 1;
}

exports.removeClassLevelFunc.archer5 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_5_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
}

exports.removeClassLevelFunc.archer6 = function(character){

  character.powEq -= 5;
  character.sklEq -= 1;
  character.lukEq -= 1;
  character.resEq -= 1;
}

exports.removeClassLevelFunc.archer7 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_7_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
  character.sklEq -= 2;
  character.spdEq -= 1;
}

exports.removeClassLevelFunc.archer8 = function(character){

}

exports.removeClassLevelFunc.archer9 = function(character){

}

exports.removeClassLevelFunc.archer10 = function(character){

}
