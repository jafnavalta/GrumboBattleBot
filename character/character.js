//Classes
let classes = require('./classes.js').classes;
let raidfunc = require('../command/raid.js');

exports.BASE_WAIT_TIME = 4200000 //70 minutes
exports.BASE_HP = 70;
exports.BASE_POW = 40;
exports.BASE_WIS = 40;
exports.BASE_SKL = 35;
exports.BASE_DEF = 35;
exports.BASE_RES = 1;
exports.BASE_SPD = 10;
exports.BASE_LUK = 0;

//HP
//Mainly affects chance of victory
exports.calculateBaseHP = function(character){

	return exports.BASE_HP + Math.floor(character.level/1.5);
}

//POW
//Mainly affects damage chance of victory
exports.calculateBasePOW = function(character){

	return exports.BASE_POW + character.level;
}

//WIS
//Mainly affects damage chance of victory. Less impactful than POW on chance.
exports.calculateBaseWIS = function(character){

	return exports.BASE_WIS + character.level;
}

//SKL
//Mainly affects chance of victory in non-battles. Most impactful on chance.
exports.calculateBaseSKL = function(character){

	return exports.BASE_SKL + Math.floor(character.level/1.33);
}

//DEF
//Mainly affects HP loss during battle
exports.calculateBaseDEF = function(character){

	return exports.BASE_DEF + Math.ceil(character.level/2);
}

//RES
//Mainly affects chances of avoiding bad active effects
exports.calculateBaseRES = function(character){

	return exports.BASE_RES + Math.floor(character.level/10);
}

//SPD
//Mainly affects time until next battle
exports.calculateBaseSPD = function(character){

	return exports.BASE_SPD;
}

//LUK
//Mainly affects loot rolls and percentage of extra gold gained
exports.calculateBaseLUK = function(character){

	return exports.BASE_LUK;
}

//Calculates wait time based on base wait time and spd
exports.calculateWaitTime = function(character){

	//Every point of speed is 1 minute less wait
	var waitTime = exports.BASE_WAIT_TIME - (character.spd * 60000);
	return waitTime;
}

//Level up (or down) a character and adjust stats
exports.levelChange = function(character, change){

	if(change != 0){

		character.level += change;
		exports.calculateStats(character);
	}
}

//Calculate stats
exports.calculateStats = function(character){

	var classStats = classes[character.classId];
	character.maxHP = Math.ceil(exports.calculateBaseHP(character) * classStats.hpX) + character.hpMod + character.hpEq;
	if(character.maxHP < 20) character.maxHP = 20; //CAP MAX HP
	if(character.hp == null || character.hp > character.maxHP) character.hp = character.maxHP;
	character.pow = Math.ceil(exports.calculateBasePOW(character) * classStats.powX) + character.powMod + character.powEq;
	character.wis = Math.ceil(exports.calculateBaseWIS(character) * classStats.wisX) + character.wisMod + character.wisEq;
	character.skl = Math.ceil(exports.calculateBaseSKL(character) * classStats.sklX) + character.sklMod + character.sklEq;
	character.def = Math.ceil(exports.calculateBaseDEF(character) * classStats.defX) + character.defMod + character.defEq;
	character.res = Math.ceil(exports.calculateBaseRES(character) * classStats.resX) + character.resMod + character.resEq;
	character.spd = Math.ceil(exports.calculateBaseSPD(character) * classStats.spdX) + character.spdMod + character.spdEq;
	if(character.spd > 50) character.spd = 50; //CAP SPEED
	character.luk = Math.ceil(exports.calculateBaseLUK(character) * classStats.lukX) + character.lukMod + character.lukEq;
	character.turn = 0 + character.turnMod + character.turnEq;
	if(character.turn > raidfunc.RAID_TURN_VALUE) character.turn = raidfunc.RAID_TURN_VALUE;
	character.aggro = 10 + character.aggroMod + character.aggroEq;
	if(character.aggro < 5) character.aggro = 5;
}

//Resist active effect message
exports.resistMessage = function(eventName){

	return "You resisted " + eventName + "!";
}
