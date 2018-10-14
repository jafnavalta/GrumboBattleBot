//Initialize DB
let dbfunc = require('../data/db.js');

//Initialize items
const fs = require("fs");
let itemList = JSON.parse(fs.readFileSync("./values/items.json", "utf8"));
let activesList = JSON.parse(fs.readFileSync("./values/actives.json", "utf8"));

//CONSTANTS
//Item types
const IMMEDIATE = "immediate"; //Consume with no active state, no duration
const CONSUME = "consume"; //Consume with active state, has duration
const NONCONSUME = "nonconsume"; //Don't consume with no active state, could have duration
const TOGGLE = "toggle"; //Don't consume with active state. Stays active until used again
const INDEFINITE = "indefinite"; //Consume with active state, no duration

//Active types
const GOOD = "good";
const BAD = "bad";
const NEUTRAL = "neutral";

//Equip types
const HEAD = "head";
const ARMOR = "armor";
const BOTTOM = "bottom";
const WEAPON = "weapon";

//Battle states
const PREBATTLE = "prebattle"; //Before battle begins
const PRERESULTS = "preresults"; //After battle ends but before results are calculated
const POSTRESULTS = "postresults"; //After results are calculated
const FINAL = "final"; //Final character state after everything else

//Battle types
const BATTLE = "battle";
const BOSS = "boss";
const RAID = "raid";

//Turn types
const CHARACTER = "character";
const BOTH = "both";
//Other turn type would be BOSS above

//Target types
const MULTIPLE = "multiple";
const SINGLE = "single";

//Battle functions
let battlefunc = require('../command/battle.js');

//Active functions
let characterfunc = require('../actives/active_character.js');
let grumbofunc = require('../actives/active_grumbo.js');
let usefunc = require('../actives/active_use.js');

//Character functions, not to be confused with the active character functions, characterfunc
let charfunc = require('../character/character.js');

//EXPORTS
exports.IMMEDIATE = IMMEDIATE;
exports.CONSUME = CONSUME;
exports.NONCONSUME = NONCONSUME;
exports.TOGGLE = TOGGLE;
exports.INDEFINITE = INDEFINITE;

exports.GOOD = GOOD;
exports.BAD = BAD;
exports.NEUTRAL = NEUTRAL;

exports.PREBATTLE = PREBATTLE;
exports.PRERESULTS = PRERESULTS;
exports.POSTRESULTS = POSTRESULTS;

exports.BATTLE = BATTLE;
exports.BOSS = BOSS;
exports.RAID = RAID;

exports.CHARACTER = CHARACTER;
exports.BOTH = BOTH;

exports.MULTIPLE = MULTIPLE;
exports.SINGLE = SINGLE;

///////////
// ITEMS //
///////////
/**
* Do a particular function based on the eventId (item, equip, effect, skill, etc.) and consume eventId
*/
exports.immediate = function(message, character, eventId, event, amount){

	var state = {

		result: message.member.displayName + " has used " + event.name + " x" + amount,
		save: true
	}
	usefunc.immediate[eventId](message, character, state, eventId, event, amount);

	message.channel.send(state.result);

	//Save character
	if(state.save){

		dbfunc.updateCharacter(character);
	}
}

/**
* Add consumed eventId to active list.
*/
exports.consume = function(message, character, eventId, event, amount){

	var result = message.member.displayName + " has used " + event.name + " x" + amount;

	dbfunc.getDB().collection("actives").findOne({"_id": character._id + eventId, "character": character._id, "id": eventId}, function(err, active){

		var wasConsumed = true;
		if(active == null){

			dbfunc.pushToState(character, eventId, event, event.battleStates, amount);
		}
		else{

			//Extend duration of consumable
			//If duration is 0, don't allow use of item. Duration will be 0 if null.
			if(active.duration == 10 || active.duration + (event.duration * amount) > 10){

				result = "You can't have an active for longer than 10 battles";
				wasConsumed = false;
			}
			else{

				active.duration += event.duration * amount;
				dbfunc.updateActive(active);
			}
		}
		if(wasConsumed){

			for(var i = 0; i < amount; i++){

				var index = character.items.indexOf(eventId);
				character.items.splice(index, 1);
			}
		}

		message.channel.send(result);

		//Save character
		dbfunc.updateCharacter(character);
	});
}

/**
* Do a particular function based on the eventId (item, equip, effect, skill, etc.) without consuming eventId
*/
exports.nonconsume = function(message, character, eventId, event, amount){

	//None right now
}

/**
* Activate or deactivate the eventId.
*/
exports.toggle = function(message, character, eventId, event, amount){

	dbfunc.getDB().collection("actives").findOne({"_id": character._id + eventId, "character": character._id, "id": eventId}, function(err, active){

		//Deactivate
		if(active != null){

			dbfunc.spliceFromState(character, eventId, event, event.battleStates, active);
			message.channel.send(message.member.displayName + " has deactivated " + event.name);
		}
		//Activate
		else{

			dbfunc.pushToState(character, eventId, event, event.battleStates, null);
			message.channel.send(message.member.displayName + " has activated " + event.name);
		}

		//Save character
		dbfunc.updateCharacter(character);
	});
}

/**
* Add indefinite eventId to active list.
*/
exports.indefinite = function(message, character, eventId, event, amount){

	var result = message.member.displayName + " has used " + event.name;

	dbfunc.getDB().collection("actives").findOne({"_id": character._id + eventId, "character": character._id, "id": eventId}, function(err, active){

		var wasConsumed = true;
		if(active == null){

			dbfunc.pushToState(character, eventId, event, event.battleStates, 1);
		}
		else{

			result = message.member.displayName + " already has " + event.name + " active!";
			wasConsumed = false;
		}
		if(wasConsumed){

			var index = character.items.indexOf(eventId);
			character.items.splice(index, 1);
		}

		message.channel.send(result);

		//Save character
		dbfunc.updateCharacter(character);
	});
}

///////////
// EQUIP //
///////////
/**
* Equip. Set type to equipId. Recalculate stats.
*/
exports.equip = function(message, character, equip){

	character.hpEq += equip.hp;
	character.powEq += equip.pow;
	character.wisEq += equip.wis;
	character.sklEq += equip.skl;
	character.defEq += equip.def;
	character.resEq += equip.res;
	character.spdEq += equip.spd;
	character.lukEq += equip.luk;
	character.turnEq += equip.turn;
	character.aggroEq += equip.aggro;

	if(equip.active != null){

		var active = activesList[equip.active];
		active._id = character._id + equip.active;
	  active.character = character._id;
		dbfunc.pushToState(character, active.id, active, active.battleStates, 1);
	}

	character[equip.type] = equip.id;

	charfunc.calculateStats(character);

	message.channel.send(message.member.displayName + " equipped " + equip.name + "!");
}

/**
* Unequip. Set type to empty string. Recalculate stats.
*/
exports.unequip = function(message, character, equip){

	character.hpEq -= equip.hp;
	character.powEq -= equip.pow;
	character.wisEq -= equip.wis;
	character.sklEq -= equip.skl;
	character.defEq -= equip.def;
	character.resEq -= equip.res;
	character.spdEq -= equip.spd;
	character.lukEq -= equip.luk;
	character.turnEq -= equip.turn;
	character.aggroEq -= equip.aggro;

	if(equip.active != null){

		var active = activesList[equip.active];
		active._id = character._id + equip.active;
	  active.character = character._id;
		dbfunc.spliceFromState(character, active.id, active, active.battleStates, active);
	}

	character[equip.type] = "";

	charfunc.calculateStats(character);

	message.channel.send(message.member.displayName + " unequipped " + equip.name + "!");
}
