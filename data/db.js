//Initialize MongoDB
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

//Config
let config = require('../config.js');

//Character.js for new characters and migrations
let charfunc = require('../character/character.js');

//For old character file
const fs = require("fs");

var db;

//Connect to db server and set DB. Finish with callback.
exports.connectToServer = function(callback){

	MongoClient.connect(config.DBURI, { useNewUrlParser: true }, function(error, client){

		assert.equal(null, error);
		db = client.db();

		//As of higher versions, DO NOT use a levels.json because of the actives/class tables not being dealt with. Leaving this if for note though, we have backup DBs just in case.
		if(fs.existsSync("./levels.json")){

			//If levels.json still exists, use it for DB
			let levels = JSON.parse(fs.readFileSync("./levels.json", "utf8"));
			let characters = [];
			migrateCharacters(levels, characters);

			db.dropDatabase();
			db.collection("characters").insertMany(characters, function (err, result){

				checkVersion(callback);
			});
		}
		else{

			//Unlock characters
			db.collection("characters").updateMany({}, {$set: {"battleLock": false}}, {upsert: true}, function (err, result){

				checkVersion(callback);
			});
		}
	});
}

//Get the DB
exports.getDB = function(){

	return db;
}

//Create new character and insert into DB. Finish with callback.
exports.createNewCharacter = function(message, callback){

	//Goes into 'characters' table
	//The 'active' table for active effects is a separate table
	var newCharacter = {

		level: 1,
		experience: 0,
		_id: message.author.id,
		powMod: 0, //Permanent mods to stats. Base is calculated below. When switching classes/leveling up these factor in last in calculations
		wisMod: 0,
		defMod: 0,
		resMod: 0,
		spdMod: 0,
		lukMod: 0,
		powEq: 0, //Equip/Temp mods to stats. When switching classes/leveling up these factor in second last in calculations
		wisEq: 0,
		defEq: 0,
		resEq: 0,
		spdEq: 0,
		lukEq: 0,
		wins: 0,
		losses: 0,
		winrate: 0,
		battlesLeft: 5,
		battletime: 9999999999999,
		battleLock: false,
		bosstime: 0,
		challengeWins: 0,
		challengeLosses: 0,
		challengeWinrate: 0,
		challengesLeft: 3,
		challengetime: 9999999999999,
		gold: 700,
		items: ['battle_ticket', 'challenge_ticket', 'battle_potion', 'battle_potion'],
		prebattle: [],
		preresults: [],
		postresults: [],
		final: [],
		head: "",
		armor: "",
		bottom: "",
		weapon: "",
		equips: [],
		classId: "adventurer",
		classLevel: 1,
		classExp: 0,
		classTime: 0,
		skills: [] //TODO
	};

	newCharacter.hp = charfunc.calculateBaseHP(newCharacter);
	charfunc.calculateStats(newCharacter);

	db.collection("characters").insertOne(newCharacter, function(err, result){

		callback();
	});
}

//Update character in DB
exports.updateCharacter = function(character){

	db.collection("characters").updateOne(
		{"_id": character._id},
		{$set: character},
		{upsert: true}
	);
}

//Update class in DB
exports.updateClass = function(classObj){

	db.collection("classes").updateOne(
		{"_id": classObj._id},
		{$set: classObj},
		{upsert: true}
	);
}

//ACTIVES: active._id is a concatenation of character._id and active.id. Both are also included in the active collection individually.
//Update character actives in DB
exports.updateActive = function(active){

	db.collection("actives").updateOne(
		{"_id": active._id},
		{$set: active},
		{upsert: true}
	);
}

//Remove a character active from DB
exports.removeActive = function(active){

	db.collection("actives").deleteOne(
		{"_id": active._id}
	);
}

//Update the rotation and special shops
exports.updateRotationSpecialEquip = function(rotation, special, equip, callback){

	db.collection("shop_rotation").insertMany(rotation, function (err, result){

		db.collection("shop_special").insertMany(special, function (err, result){

			db.collection("shop_equip").insertMany(equip, function (err, result){

				callback();
			});
		});
	});
}

//Update a rotation item
exports.updateRotationItem = function(item){

	db.collection("shop_rotation").updateOne(
		{"shop": "rotation", "id": item.id},
		{$set: item},
		{upsert: true}
	);
}

//Update a rotation item
exports.updateSpecialItem = function(item){

	db.collection("shop_special").updateOne(
		{"shop": "special", "id": item.id},
		{$set: item},
		{upsert: true}
	);
}

//Update an equip item
exports.updateEquipItem = function(item){

	db.collection("shop_equip").updateOne(
		{"shop": "equip", "id": item.id},
		{$set: item},
		{upsert: true}
	);
}

/**
* Push to character state active.
*/
exports.pushToState = function(character, eventId, event, eventStates, amount){

	var totalDuration = event.duration;
	if(amount != null){

		//If totalDuration is null, this will make it 0
		totalDuration = totalDuration * amount;
	}
	var id = character._id + eventId;
	var newActive = {

		_id: id,
		character: character._id,
		id: eventId,
		battleStates: event.battleStates,
		name: event.name,
		duration: totalDuration
	}

	for(var i = 0; i < eventStates.length; i++){

		var eventState = eventStates[i];
		character[eventState].push(eventId);
	}

	module.exports.updateActive(newActive);
}

/**
* Splice from character state active.
*/
exports.spliceFromState = function(character, eventId, event, eventStates, active){

	for(var i = 0; i < eventStates.length; i++){

		var eventState = eventStates[i];
		var index = character[eventState].indexOf(eventId);
		character[eventState].splice(index, 1);
	}

	module.exports.removeActive(active);
}

/**
* Reduce the duration of an active and its states.
*/
exports.reduceDuration = function(character, characterStates, eventId, actives){

	var active;
	for(var i = 0; i < actives.length; i++){

		if(actives[i].id == eventId){

			active = actives[i];
			break;
		}
	}
	if(active != null){

		if(active.duration <= 1){

			for(var i = 0; i < characterStates.length; i++){

				var characterState = characterStates[i];
				var index = characterState.indexOf(eventId);
				characterState.splice(index, 1);
				module.exports.removeActive(active);
			}
		}
		else{

			active.duration -= 1;
			module.exports.updateActive(active);
		}
	}
	else{

		//Case where an active didn't get removed from a state somehow
		for(var i = 0; i < characterStates.length; i++){

			var characterState = characterStates[i];
			var index = characterState.indexOf(eventId);
			if(index >= 0){

				characterState.splice(index, 1);
			}
		}
	}
}


/**
* Migrates level to characters array for inserting into DB.
*/
function migrateCharacters(levels, characters){

	for(var key in levels){

		var character = levels[key];
		if(character._id == null){

			character._id = character.id;
			delete character.id;
		}
		if(character.battleLock == null || character.battleLock == true){

			character.battleLock = false;
		}
		if(character.items == null){

			character.items = ['battle_ticket', 'challenge_ticket', 'battle_potion', 'battle_potion'];
		}
		if(character.active != null){

			delete character.active;
		}

		characters.push(character);
	}

	fs.unlinkSync("./levels.json");
}

/**
* Checks version of DB and updates game accordingly.
*/
function checkVersion(callback){

	db.collection("version").findOne(function(error, version){

		if(version == null){

			db.collection("characters").findOne(function(error, character){

				if(character == null){

					//New game, set version to config.VERSION, run game as usual
					var newVersion = {

						_id: 1,
						version: config.VERSION
					}
					db.collection("version").insertOne(newVersion, function(error, result){

						callback();
					});
				}
				else{

					//DB is at version 1, run recursive migration method with version 1
					var newVersion = {

						_id: 1,
						version: 1
					}
					runMigrations(newVersion, callback);
				}
			});
		}
		else{

			//Run every migration from current version to config.VERSION using recursive migration method
			runMigrations(version, callback);
		}
	});
}

/**
*
*/
function runMigrations(version, callback){

	//Migration 1 to 3: Stats
	if(version.version <= 3){

		db.collection("characters").find().toArray(function(error, characters){

			for(var i = 0; i < characters.length; i++){

				var character = characters[i];
				character.hp = charfunc.calculateBaseHP(character);
				character.pow = charfunc.calculateBasePOW(character);
				character.wis = charfunc.calculateBaseWIS(character);
				character.def = charfunc.calculateBaseDEF(character);
				character.res = charfunc.calculateBaseRES(character);
				character.spd = charfunc.calculateBaseSPD(character);
				character.luk = charfunc.calculateBaseLUK(character);
				character.powMod = 0;
				character.wisMod = 0;
				character.defMod = 0;
				character.resMod = 0;
				character.spdMod = 0;
				character.lukMod = 0;
				character.powEq = 0;
				character.wisEq = 0;
				character.defEq = 0;
				character.resEq = 0;
				character.spdEq = 0;
				character.lukEq = 0;
				if(character.prebattle.includes('poison')){

					character.postresults.push('poison');
				}

				if(i == characters.length - 1){

					//final character to update, finish this migration
					db.collection("characters").updateOne(
						{"_id": character._id},
						{$set: character},
						{upsert: true},
						function(){

							version.version = 4;
							runMigrations(version, callback);
					});
				}
				else{

					module.exports.updateCharacter(character);
				}
			};
		});
	}

	//Migration 4 to 6: Class fields and table, Equip fields
	else if(version.version <= 5){

		db.collection("characters").find().toArray(function(error, characters){

			for(var i = 0; i < characters.length; i++){

				var character = characters[i];
				character.powEq += 1;
				character.wisEq += -1;
				character.defEq += -1;
				character.resEq += 0;
				character.spdEq += 0;
				character.lukEq += 0;
				character.head = "";
				character.armor = "";
				character.bottom = "";
				character.weapon = "";
				character.equips = [];
				character.classId = "adventurer";
				character.classLevel = 1;
				character.classExp = 0,
				character.classTime = 0;
				character.skills = [];
				character.hp = charfunc.calculateBaseHP(character);
				charfunc.calculateStats(character);

				var classRow = {
					_id: character._id + "adventurer",
					character: character._id,
					classId: "adventurer",
					classLevel: 1,
					classExp: 0
				}

				if(i == characters.length - 1){

					module.exports.updateClass(classRow);

					//final character to update, finish this migration
					db.collection("characters").updateOne(
						{"_id": character._id},
						{$set: character},
						{upsert: true},
						function(){

							version.version = 6;
							runMigrations(version, callback);
					});
				}
				else{

					module.exports.updateClass(classRow);
					module.exports.updateCharacter(character);
				}
			};
		});
	}

	//Migration 6 to 7: Final state, moving some actives to final
	else if(version.version <= 6){

		db.collection("characters").find().toArray(function(error, characters){

			for(var i = 0; i < characters.length; i++){

				var character = characters[i];
				character.final = [];

				if(character.postresults.includes('dodge')){

					character.postresults.splice(character.postresults.indexOf('dodge'), 1);
					character.final.push('dodge');
				}
				if(character.postresults.includes('vision')){

					character.postresults.splice(character.postresults.indexOf('vision'), 1);
					character.final.push('vision');
				}
				if(character.postresults.includes('safety_hat')){

					character.postresults.splice(character.postresults.indexOf('safety_hat'), 1);
					character.final.push('safety_hat');
				}
				if(character.postresults.includes('stand_your_ground')){

					character.postresults.splice(character.postresults.indexOf('stand_your_ground'), 1);
					character.final.push('stand_your_ground');
				}
				if(character.postresults.includes('miracle')){

					character.final.push('miracle');
				}

				if(i == characters.length - 1){

					//final character to update, finish this migration
					db.collection("characters").updateOne(
						{"_id": character._id},
						{$set: character},
						{upsert: true},
						function(){

							version.version = 7;
							runMigrations(version, callback);
					});
				}
				else{

					module.exports.updateCharacter(character);
				}
			};
		});
	}

	//Migration 7 to 8: boss timer
	else if(version.version <= 7){

		db.collection("characters").find().toArray(function(error, characters){

			for(var i = 0; i < characters.length; i++){

				var character = characters[i];
				character.bosstime = 0;

				if(i == characters.length - 1){

					//final character to update, finish this migration
					db.collection("characters").updateOne(
						{"_id": character._id},
						{$set: character},
						{upsert: true},
						function(){

							version.version = 8;
							runMigrations(version, callback);
					});
				}
				else{

					module.exports.updateCharacter(character);
				}
			};
		});
	}

	//Add more migrations before this with else if
	//If gets to else, DB is up to date
	else{

		db.collection("version").updateOne(
			{"_id": version._id},
			{$set: version},
			{upsert: true},
			function(error, result){

			callback();
		});
	}
}
