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
exports.className = "Rogue";

exports.CLASS_LEVEL_MAX = 7;

//Actives
const LEVEL_1_ACTIVE = 'second_chance';
const LEVEL_3_ACTIVE = 'quick_step';
const LEVEL_4_ACTIVE = 'power_of_wealth';
const LEVEL_5_ACTIVE = 'haste';
const LEVEL_6_ACTIVE = 'double_attack';

const BASE_HP_EQ = 0;
const BASE_POW_EQ = -2;
const BASE_WIS_EQ = 2;
const BASE_SKL_EQ = 0;
const BASE_DEF_EQ = -2;
const BASE_RES_EQ = 2;
const BASE_SPD_EQ = 5;
const BASE_LUK_EQ = 10;
const BASE_TURN_EQ = 100;
const BASE_AGGRO_EQ = -2;

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

exports.hpX = 0.95;
exports.powX = 1.05;
exports.wisX = 1.03;
exports.sklX = 1.23;
exports.defX = 0.85;
exports.resX = 1.01;
exports.spdX = 1;
exports.lukX = 1;

exports.levelUp = {};
exports.setClassLevelFunc = {};
exports.removeClassLevelFunc = {};

//////////////////////////////
// CLASS LEVEL UP FUNCTIONS // //Typically, anything permanent followed by accompanying setClassLevelFunc.
//////////////////////////////
exports.levelUp.rogue1 = function(character){

  exports.setClassLevelFunc.rogue1(character);
  character.spdMod += 1;
}

exports.levelUp.rogue2 = function(character){

  exports.setClassLevelFunc.rogue2(character);
  character.spdMod += 1;
}

exports.levelUp.rogue3 = function(character){

  exports.setClassLevelFunc.rogue3(character);
  character.spdMod += 1;
}

exports.levelUp.rogue4 = function(character){

  exports.setClassLevelFunc.rogue4(character);
  character.spdMod += 1;
}

exports.levelUp.rogue5 = function(character){

  exports.setClassLevelFunc.rogue5(character);
  character.spdMod += 1;
}

exports.levelUp.rogue6 = function(character){

  exports.setClassLevelFunc.rogue6(character);
  character.spdMod += 1;
}

exports.levelUp.rogue7 = function(character){

  exports.setClassLevelFunc.rogue7(character);
  character.spdMod += 1;
}

exports.levelUp.rogue8 = function(character){

  exports.setClassLevelFunc.rogue8(character);
  character.spdMod += 1;
}

exports.levelUp.rogue9 = function(character){

  exports.setClassLevelFunc.rogue9(character);
  character.spdMod += 1;
}

exports.levelUp.rogue10 = function(character){

  exports.setClassLevelFunc.rogue10(character);
  character.spdMod += 1;
}

/////////////////////////////// Set class level mods
// SET CLASS LEVEL FUNCTIONS // Set class level actives
/////////////////////////////// Set class level skills (NOT IMPLEMENTED YET)
exports.setClassLevelFunc.rogue1 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_1_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
}

exports.setClassLevelFunc.rogue2 = function(character){

  character.spdEq += 2;
  character.lukEq += 2;
}

exports.setClassLevelFunc.rogue3 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_3_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
}

exports.setClassLevelFunc.rogue4 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_4_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
}

exports.setClassLevelFunc.rogue5 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_5_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
  character.spdEq += 2;
  character.powEq += 4;
  character.resEq += 1;
}

exports.setClassLevelFunc.rogue6 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_6_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
  character.spdEq += 2;
  character.lukEq += 2;
}

exports.setClassLevelFunc.rogue7 = function(character){

  character.spdEq += 1;
  character.sklEq += 2;
  character.lukEq += 5;
  character.powEq += 4;
}

exports.setClassLevelFunc.rogue8 = function(character){

}

exports.setClassLevelFunc.rogue9 = function(character){

}

exports.setClassLevelFunc.rogue10 = function(character){

}

////////////////////////////////// Remove class level mods (equips are removed in class.js)
// REMOVE CLASS LEVEL FUNCTIONS // Remove class level actives
////////////////////////////////// Remove class level skills
exports.removeClassLevelFunc.rogue1 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_1_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
}

exports.removeClassLevelFunc.rogue2 = function(character){

  character.spdEq -= 2;
  character.lukEq -= 2;
}

exports.removeClassLevelFunc.rogue3 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_3_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
}

exports.removeClassLevelFunc.rogue4 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_4_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
}

exports.removeClassLevelFunc.rogue5 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_5_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
  character.spdEq -= 2;
  character.powEq -= 4;
  character.resEq -= 1;
}

exports.removeClassLevelFunc.rogue6 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_6_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
  character.spdEq -= 2;
  character.lukEq -= 2;
}

exports.removeClassLevelFunc.rogue7 = function(character){

  character.spdEq -= 1;
  character.sklEq -= 2;
  character.lukEq -= 5;
  character.powEq -= 4;
}

exports.removeClassLevelFunc.rogue8 = function(character){

}

exports.removeClassLevelFunc.rogue9 = function(character){

}

exports.removeClassLevelFunc.rogue10 = function(character){

}
