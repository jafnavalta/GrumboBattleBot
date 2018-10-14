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
exports.className = "Knight";

exports.CLASS_LEVEL_MAX = 7;

//Actives
const LEVEL_1_ACTIVE = 'armory';
const LEVEL_3_ACTIVE = 'recoil';
const LEVEL_4_ACTIVE = 'guardian';
const LEVEL_5_ACTIVE = 'stand_your_ground';
const LEVEL_6_ACTIVE = 'for_honor';

const BASE_HP_EQ = 0;
const BASE_POW_EQ = 0;
const BASE_WIS_EQ = -5;
const BASE_SKL_EQ = 0;
const BASE_DEF_EQ = 6;
const BASE_RES_EQ = -12;
const BASE_SPD_EQ = -15;
const BASE_LUK_EQ = 0;
const BASE_TURN_EQ = 0;
const BASE_AGGRO_EQ = 10;

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

exports.hpX = 1.11;
exports.powX = 0.90;
exports.wisX = 0.73;
exports.sklX = 1.16;
exports.defX = 1.15;
exports.resX = 1;
exports.spdX = 1;
exports.lukX = 1;

exports.levelUp = {};
exports.setClassLevelFunc = {};
exports.removeClassLevelFunc = {};

//////////////////////////////
// CLASS LEVEL UP FUNCTIONS // //Typically, anything permanent followed by accompanying setClassLevelFunc.
//////////////////////////////
exports.levelUp.knight1 = function(character){

  exports.setClassLevelFunc.knight1(character);
  character.defMod += 2;
}

exports.levelUp.knight2 = function(character){

  exports.setClassLevelFunc.knight2(character);
  character.defMod += 2;
}

exports.levelUp.knight3 = function(character){

  exports.setClassLevelFunc.knight3(character);
  character.defMod += 2;
}

exports.levelUp.knight4 = function(character){

  exports.setClassLevelFunc.knight4(character);
  character.defMod += 2;
}

exports.levelUp.knight5 = function(character){

  exports.setClassLevelFunc.knight5(character);
  character.defMod += 2;
}

exports.levelUp.knight6 = function(character){

  exports.setClassLevelFunc.knight6(character);
  character.defMod += 2;
}

exports.levelUp.knight7 = function(character){

  exports.setClassLevelFunc.knight7(character);
  character.defMod += 2;
}

exports.levelUp.knight8 = function(character){

  exports.setClassLevelFunc.knight8(character);
  character.defMod += 2;
}

exports.levelUp.knight9 = function(character){

  exports.setClassLevelFunc.knight9(character);
  character.defMod += 2;
}

exports.levelUp.knight10 = function(character){

  exports.setClassLevelFunc.knight10(character);
  character.defMod += 2;
}

/////////////////////////////// Set class level mods
// SET CLASS LEVEL FUNCTIONS // Set class level actives
/////////////////////////////// Set class level skills (NOT IMPLEMENTED YET)
exports.setClassLevelFunc.knight1 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_1_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
}

exports.setClassLevelFunc.knight2 = function(character){

  character.defEq += 4;
}

exports.setClassLevelFunc.knight3 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_3_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
}

exports.setClassLevelFunc.knight4 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_4_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
  character.spdEq += 5;
  character.resEq += 4;
  character.powEq += 4;
}

exports.setClassLevelFunc.knight5 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_5_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
}

exports.setClassLevelFunc.knight6 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_6_ACTIVE);
  dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
  character.spdEq += 5;
  character.resEq += 4;
  character.powEq += 4;
  character.sklEq += 1;
  character.defEq += 1;
}

exports.setClassLevelFunc.knight7 = function(character){

  character.powEq += 6;
  character.sklEq += 2;
  character.defEq += 2;
}

exports.setClassLevelFunc.knight8 = function(character){

}

exports.setClassLevelFunc.knight9 = function(character){

}

exports.setClassLevelFunc.knight10 = function(character){

}

////////////////////////////////// Remove class level mods (equips are removed in class.js)
// REMOVE CLASS LEVEL FUNCTIONS // Remove class level actives
////////////////////////////////// Remove class level skills
exports.removeClassLevelFunc.knight1 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_1_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
}

exports.removeClassLevelFunc.knight2 = function(character){

  character.defEq -= 4;
}

exports.removeClassLevelFunc.knight3 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_3_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
}

exports.removeClassLevelFunc.knight4 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_4_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
  character.spdEq -= 5;
  character.resEq -= 4;
  character.powEq -= 4;
}

exports.removeClassLevelFunc.knight5 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_5_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
}

exports.removeClassLevelFunc.knight6 = function(character){

  var active = classactivefunc.getActive(character, LEVEL_6_ACTIVE);
  dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
  character.spdEq -= 5;
  character.resEq -= 4;
  character.powEq -= 4;
  character.sklEq -= 1;
  character.defEq -= 1;
}

exports.removeClassLevelFunc.knight7 = function(character){

  character.powEq -= 6;
  character.sklEq -= 2;
  character.defEq -= 2;
}

exports.removeClassLevelFunc.knight8 = function(character){

}

exports.removeClassLevelFunc.knight9 = function(character){

}

exports.removeClassLevelFunc.knight10 = function(character){

}
