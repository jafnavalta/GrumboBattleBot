//Initialize MongoDB
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

//Config
let config = require('../config.js');

//For old character file
const fs = require("fs");

var db;

module.exports = {
	
	//Connect to db server and set DB. Finish with callback.
	connectToServer: function(callback){
		
		MongoClient.connect(config.DBURI, { useNewUrlParser: true }, function(error, client){
	  
			assert.equal(null, error);
			db = client.db();
			
			if(fs.existsSync("./levels.json")){
			
				//If levels.json still exists, use it for DB
				let levels = JSON.parse(fs.readFileSync("./levels.json", "utf8"));
				let characters = [];
				migrateCharacters(levels, characters);
				
				db.dropDatabase();
				db.collection("characters").insertMany(characters, function (err, result){
					
					callback();
				});
			}
			else{
				
				db.collection("characters").updateMany({}, {$set: {"battleLock": false}}, {upsert: true}, function (err, result){
				
					callback();
				});
			}
		});
	},
	
	//Get the DB
	getDB: function(){
		
		return db;
	},
	
	//Create new character and insert into DB. Finish with callback.
	createNewCharacter: function(message, callback){
		
		//Goes into 'characters' table
		//The 'active' table for active effects is a separate table
		var newCharacter = {
					
			level: 1,
			experience: 0,
			_id: message.author.id,
			wins: 0,
			losses: 0,
			winrate: 0,
			battlesLeft: 3,
			battletime: 9999999999999,
			battleLock: false,
			challengeWins: 0,
			challengeLosses: 0,
			challengeWinrate: 0,
			challengesLeft: 3,
			challengetime: 9999999999999,
			gold: 0,
			items: ['battle_ticket', 'challenge_ticket', 'battle_potion', 'battle_potion'],
			prebattle: [],
			preresults: [],
			postresults: []
		};
		
		db.collection("characters").insertOne(newCharacter, function(err, result){
			
			callback();
		});
	},
	
	//Update character in DB
	updateCharacter: function(character){
		
		db.collection("characters").updateOne(
			{"_id": character._id},
			{$set: character},
			{upsert: true}
		);
	},
	
	//ACTIVES: active._id is a concatenation of character._id and active.id. Both are also included in the active collection individually.
	//Update character actives in DB
	updateActive: function(active){
		
		db.collection("actives").updateOne(
			{"_id": active._id},
			{$set: active},
			{upsert: true}
		);
	},
	
	//Remove a character active from DB
	removeActive: function(active){
		
		db.collection("actives").deleteOne(
			{"_id": active._id}
		);
	},
	
	//Update the rotation and special shops
	updateRotationSpecial: function(rotation, special, callback){
		
		db.collection("shop_rotation").insertMany(rotation, function (err, result){
						
			db.collection("shop_special").insertMany(special, function (err, result){
						
				callback();
			});
		});
	},
	
	//Update a rotation item
	updateRotationItem: function(item){
		
		db.collection("shop_rotation").updateOne(
			{"shop": "rotation", "id": item.id},
			{$set: item},
			{upsert: true}
		);
	},
	
	//Update a rotation item
	updateSpecialItem: function(item){
		
		db.collection("shop_special").updateOne(
			{"shop": "special", "id": item.id},
			{$set: item},
			{upsert: true}
		);
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