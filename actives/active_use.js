//Initialize DB functions
let dbfunc = require('../data/db.js');

//Initialize list of actives
const fs = require("fs");
let activesList = JSON.parse(fs.readFileSync("./values/actives.json", "utf8"));

//Initialize state for state constants and functions
let state = require('../state.js');

//Initialize states
//consume/toggle use regular active effects
exports.immediate = {};
exports.nonconsume = {};

/////////////////////////
// IMMEDIATE FUNCTIONS //
/////////////////////////
exports.immediate.battle_ticket = function(message, character, state, eventId, event, amount){
	
	if((character.battlesLeft + amount) <= 3){
				
		for(var i = 0; i < amount; i++){
			
			var index = character.items.indexOf(eventId);
			character.items.splice(index, 1);
		}
		character.battletime -= 3600000 * amount;
	}
	else{
		
		state.result = "You either already have all battle attempts available or attempted to use too many battle tickets.";
	}
}

exports.immediate.challenge_ticket = function(message, character, state, eventId, event, amount){
	
	if((character.challengesLeft + amount) <= 3){
				
		for(var i = 0; i < amount; i++){
			
			var index = character.items.indexOf(eventId);
			character.items.splice(index, 1);
		}
		character.challengetime -= 3600000 * amount;
	}
	else{
		
		state.result = "You already have all challenge attempts available or attempted to use too many challenge tickets.";
	}
}

exports.immediate.antidote = function(message, character, state, eventId, event, amount){
	
	if(character.prebattle.includes('poison')){
				
		var index = character.items.indexOf(eventId);
		character.items.splice(index, 1);
		index = character.prebattle.indexOf('poison');
		character.prebattle.splice(index, 1);
		var _id = character._id + 'poison';
		var active = {
			"_id": _id
		}
		dbfunc.removeActive(active);
		
		state.result = message.member.displayName + " has used an antidote";
	}
	else{
		
		state.result = "You are not poisoned at this moment";
	}
}

exports.immediate.grumbo_ticket = function(message, character, state, eventId, event, amount){
	
	if(character.battlesLeft < 3 || character.challengesLeft < 3){
				
		character.battlesLeft = 3;
		character.challengesLeft = 3;
		var index = character.items.indexOf(eventId);
		character.items.splice(index, 1);
	}
	else{
		
		state.result = "You already have all battle/challenge attempts available.";
	}
}

exports.immediate.duel_converter = function(message, character, state, eventId, event, amount){
	
	if((character.battlesLeft - amount) >= 0 && (character.challengesLeft + amount) <= 3){
				
		for(var i = 0; i < amount; i++){
			
			var index = character.items.indexOf(eventId);
			character.items.splice(index, 1);
		}
		character.battlesLeft -= 1;
		character.challengetime -= (3600000 * amount);
	}
	else{
		
		state.result = "You either have all challenge attempts or no battle attempts available.";
	}
}

exports.immediate.gamblers_coin = function(message, character, state, eventId, event, amount){
	
	var index = character.items.indexOf(eventId);
	character.items.splice(index, 1);
	var random = Math.random() * 100;
	if(random < 49.5){
		
		//Gain
		var leftover = (80 + character.experience) % 100;
		var gains = Math.floor(((80 + character.experience)/100));
		var newLevel = character.level + gains;
		character.level = newLevel;
		character.experience = leftover;
		state.result = "The coin flips a fortune of 80 experience!";
	}
	else if(random < 99){
		
		//Lose
		var leftover = character.experience - 80;
		if(leftover < 0){
			
			if(character.level == 1){
				
				character.experience = 0;
			}
			else{
				
				character.experience = 100 + leftover;
				character.level -= 1;
			}
		}
		state.result = "You dropped 80 experience with the coin. How unlucky.";
	}
	else{
		
		//Hit the jackpot
		character.gold += 7777;
		state.result = "Wow! The coin landed on its side, broke the very foundation below you, and revealed 7777 gold buried deep beneath the ground!"
	}
}

//////////////////////////
// NONCONSUME FUNCTIONS //
//////////////////////////