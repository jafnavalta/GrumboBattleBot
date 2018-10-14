//Initialize DB functions
let dbfunc = require('../data/db.js');

//Initialize fs
const fs = require("fs");

//Initialize functions
let state = require('../state/state_raid.js');
let statefunc = require('../state/state.js');
let charfunc = require('../character/character.js');
let classfunc = require('../character/class.js');

//Initialize list files
let raidList = JSON.parse(fs.readFileSync("./values/raids.json", "utf8"));
let classList = JSON.parse(fs.readFileSync("./values/classes.json", "utf8"));
let activeList = JSON.parse(fs.readFileSync("./values/actives.json", "utf8"));
let itemList = JSON.parse(fs.readFileSync("./values/items.json", "utf8"));
let equipList = JSON.parse(fs.readFileSync("./values/equips.json", "utf8"));

//Raid funcs
let activeraidfunc = require('../actives/active_raid.js');

const RAID_WAIT_TIME = 28800000; //8 hours
const RAID_MIN_MEMBERS = 2;
const RAID_MAX_MEMBERS = 4;
const RAID_BASE_PER_TURN = 70;
const RAID_TURN_VALUE = 500;

exports.RAID_WAIT_TIME = RAID_WAIT_TIME;
exports.RAID_MIN_MEMBERS = RAID_MIN_MEMBERS;
exports.RAID_MAX_MEMBERS = RAID_MAX_MEMBERS;
exports.RAID_TURN_VALUE = RAID_TURN_VALUE;

let raids = {}

/**
* Raid command
*/
exports.commandRaid = function(message, args, character){

  //For testing
  //character.level = 175;
  //character.resEq += 43;
  //charfunc.calculateStats(character);
  //character.hp = character.maxHP;
  //character.battlesLeft = 5;
  //var active = {
  //  _id: character._id + 'shuriken'
  //}
  //dbfunc.removeActive(active);
  //character.preresults.splice(character.preresults.indexOf('shuriken'), 1);
  //console.log(character.postresults);
  //character.postresults.push("growth_pill");
  // character.items.push("eyedrops", "eyedrops", "eyedrops", "eyedrops", "eyedrops");
  // character.items.push("scissors", "scissors", "scissors", "scissors", "scissors");
  // character.items.push("growth_pill", "growth_pill", "growth_pill", "growth_pill", "growth_pill");

   // character.items.push("alphav");
   // character.items.push("sunglasses");
   // character.equips.push("the_kids_gambit");
   // character.equips.push("feather_hat");
   // character.equips.push("ragged_bow");
   // character.equips.push("robin_shoes");

  //character.wisEq += 100;
  //character.defEq -= 10;
  //character.final.push('defense_up');
  //character.postresults.splice(character.postresults.indexOf("haste"), 1);

  //Determine how many battles they should have left
  var date = new Date();
  var currentTime = date.getTime();
  exports.restockBattles(currentTime, character);
  var timeSinceLastRaid = currentTime - character.raidtime;

  //RAID INFO
  if(args[2] == 'info' && (args.length == 4 || (args.length == 5 && args[4] == '-d'))){

    //DM user
		var sender = message.author;
		if(args.length == 5){

			//Message channel
			sender = message.channel;
		}

    var raid = raidList[args[3]];
    if(raid != null){

      var raidString = raid.name + "  |  Lv Req: " + raid.level + "  |  Command: " + raid.id + "\n"
        + "HP " + raid.hp + "  |  POW " + raid.powBase + "  |  WIS " + raid.wisBase + "  |  SKL " + raid.sklBase + "  |  SPD " + raid.spdBase + "\n"
        + "Base Turn Victory Chance: " + raid.base_chance + "%\n"
        + raid.description + "\n"
        + "Actives: ";
      for(var i = 0; i < raid.actives.length; i++){

        var activeName = activeList[raid.actives[i]].name;
        raidString += activeName;
        if(i == raid.actives.length - 1){

          raidString += "\n";
        }
        else{

          raidString += ", ";
        }
      }
      raidString += "Loot: ";
      for(var j = 0; j < raid.loot.length; j++){

        if(raid.loot[j] != ""){

          var lootedItem = itemList[raid.loot[j]];
          if(lootedItem == null) lootedItem = equipList[raid.loot[j]];
          raidString += lootedItem.name;
          if(j == raid.loot.length - 1){

            raidString += "\n";
          }
          else{

            raidString += ", ";
          }
        }
      }
      raidString += "Gold: " + raid.gold;
      sender.send(raidString);
    }
    else{

      sender.send(args[3] + " is not a valid raid command.");
    }
  }

  //AVAILABLE RAIDS
  else if(args.length == 2 || (args.length == 3 && args[2] == '-d')){

    //DM user
		var sender = message.author;
		if(args.length == 3){

			//Message channel
			sender = message.channel;
		}

    var raidsString = "Raid List\n\n";
    for(var key in raidList){

      var raid = raidList[key];
      raidsString += raid.name + "  |  Lv Req: " + raid.level + "  |  Command: " + raid.id + "\n";
    };
    sender.send(raidsString);
  }

  //ASSEMBLE
  else if(args[2] == 'assemble' && args.length == 3){

    //Not enough battles left
    if(character.battlesLeft < 1){

      message.channel.send("You need at least 1 battle stock to raid.");
    }
    else if(character.hp <= 0){

      message.channel.send("You need to have more than 0 HP to assemble a raid!");
    }
    //Raided too recently
    else if(timeSinceLastRaid/RAID_WAIT_TIME < 1){

      var hours = Math.floor((RAID_WAIT_TIME - timeSinceLastRaid)/3600000);
      var minutes = Math.ceil(((RAID_WAIT_TIME - timeSinceLastRaid) % 3600000) / 60000);
      message.channel.send("You've raided too recently " + message.member.displayName + "!"
        + "\nYou can raid again in " + hours + " hours " + minutes + " minutes");
    }
    else{

      //Assemble raid group if not in battle/raid
      if(!character.battleLock){

        character.battleLock = true;
        raids[character._id] = [character._id];
        dbfunc.updateCharacter(character);
        message.channel.send(message.member.displayName + " has begun assembling members for a raid!");
      }
      else{

        message.channel.send("You are currently locked " + message.member.displayName + "!");
      }
    }
  }

  //CANCEL
  else if(args[2] == 'cancel' && args.length == 3){

    //Remove yourself from raid group. If you are the raid leader, the next person becomes the leader of the raid group
    if(!character.raidLock && character.battleLock){

      //Not part of a raid, but in battle
      if(raids[character._id] == null){

        message.channel.send("You are not part of a raid " + message.member.displayName + "!");
      }
      //You're not included in your raid array means you're not the leader
      else if(!raids[character._id].includes(character._id)){

        var raidLead = raids[character._id][0];
        raids[raidLead].splice(raids[raidLead].indexOf(character._id), 1);
        message.channel.send(message.member.displayName + " has left the raid.");
      }
      //Raid leader leaves, pass to next person if possible
      else{

        raids[character._id].splice(raids[character._id].indexOf(character._id), 1);
        var cancelString = message.member.displayName + " has left the raid. ";
        if(raids[character._id].length > 0){

          raids[raids[character._id][0]] = raids[character._id];
          var newLeadId = raids[character._id][0];
          cancelString += message.guild.members.get(newLeadId).displayName + " is the new raid leader!";
        }
        message.channel.send(cancelString);
      }
      raids[character._id] = null;
      character.battleLock = false;
      dbfunc.updateCharacter(character);
    }
    else if(!character.battleLock){

      message.channel.send("You are not part of a raid " + message.member.displayName + "!");
    }
    else{

      message.channel.send("You cannot cancel a raid in progress " + message.member.displayName + "!");
    }
  }

  //JOIN
  else if(args[2] == 'join' && args.length == 4){

    var leader = message.mentions.members.first();
    if(leader != null){

      //Get lead character
    	dbfunc.getDB().collection("characters").findOne({"_id": leader.id}, function(err, leadCharacter){

        if(leadCharacter != null){

          //They've begun their raid
          if(leadCharacter.raidLock){

            message.channel.send(message.guild.members.get(leader.id).displayName + " has already begun their raid!");
          }
          //Trying to join a raid group thats not started
          else if(raids[leader.id] == null){

            message.channel.send(message.guild.members.get(leader.id).displayName + " is not hosting a raid.");
          }
          //Trying to join a raid group that has maximum members
          else if(raids[leader.id].length >= RAID_MAX_MEMBERS){

            message.channel.send(message.guild.members.get(leader.id).displayName + "'s raid group has the max amount of raid members!");
          }
          else if(character.hp <= 0){

      			message.channel.send("You need to have more than 0 HP to join a raid!");
      		}
          //Not enough battles left
          else if(character.battlesLeft < 1){

            message.channel.send("You need at least 1 battle stock to raid.");
          }
          //Raided too recently
          else if(timeSinceLastRaid/RAID_WAIT_TIME < 1){

            var hours = Math.floor((RAID_WAIT_TIME - timeSinceLastRaid)/3600000);
            var minutes = Math.ceil(((RAID_WAIT_TIME - timeSinceLastRaid) % 3600000) / 60000);
            message.channel.send("You've raided too recently " + message.member.displayName + "!"
              + "\nYou can raid again in " + hours + " hours " + minutes + " minutes");
          }
          else{

            //Assemble raid group if not in battle/raid
            if(!character.battleLock){

              character.battleLock = true;
              raids[character._id] = [leader.id];
              raids[leader.id].push(character._id);
              dbfunc.updateCharacter(character);
              message.channel.send(message.member.displayName + " has joined " + message.guild.members.get(leader.id).displayName + "'s raid group!");
            }
            else{

              message.channel.send("You are currently locked " + message.member.displayName + "!");
            }
          }
        }
      });
    }
  }

  //DO ACTUAL RAID
  else if(args.length == 3){

    var raidId = args[2];

    //If raid exists
    if(raidList[raidId] != null){

      var raid = raidList[raidId];

      //Reset bosses
      raidList = JSON.parse(fs.readFileSync("./values/raids.json", "utf8"));

  		//Character is already in a raid
      if(character.raidLock){

        message.channel.send("You are currently locked " + message.member.displayName + "!");
      }
      //Character is not in a raid group
      else if(raids[character._id] == null){

        message.channel.send("You are not in a raid group " + message.member.displayName + "!");
      }
      //Character is not the raid host
  		else if(!raids[character._id].includes(character._id)){

  			message.channel.send("You are not the raid host " + message.member.displayName + "!");
  		}
      else if(raids[character._id].length < RAID_MIN_MEMBERS){

        message.channel.send("You need at least " + RAID_MIN_MEMBERS + " members to start a raid " + message.member.displayName + "!");
      }
      //RAID
  		else{

        var characterIds = raids[character._id];
        var characters = [];
        for(var x = 0; x < characterIds.length; x++){

          dbfunc.getDB().collection("characters").findOne({"_id": characterIds[x]}, function(err, raidCharacter){

            characters.push(raidCharacter);
            if(characters.length == characterIds.length){

              checkRaidReqs(message, args, characters, raid);
            }
          });
        }
  		}
    }
    else{

      message.channel.send(raidId + " is not a correct raid command.");
    }
  }

  //BAD COMMAND
  else{

		message.channel.send("Bad raid command. Try '!grumbo help' for the correct command.");
	}
}

/**
* Check requirements for raid boss, and do the raid boss if requirements met.
*/
function checkRaidReqs(message, args, characters, raidBoss){

  var canRaid = true;
  for(var x = 0; x < characters.length; x++){

    var character = characters[x];
    if(character.level < raidBoss.level){

      canRaid = false;
      break;
    }
  }

  if(canRaid){

    var activesMap = {};
    var mapCount = 0;
    for(var y = 0; y < characters.length; y++){

      //Get all character active effects
      var character = characters[y];
      dbfunc.getDB().collection("actives").find({"character": character._id}).toArray(function(err, actives){

        var active = actives[0];
        if(active != null){

          activesMap[active.character] = actives;
        }
        mapCount++;
        if(mapCount == characters.length){

          for(var z = 0; z < characters.length; z++){

            var character2 = characters[z];
            if(activesMap[character2._id] == null){

              activesMap[character2._id] = [];
            }
          }
          raidLockCharacters(message, args, characters, activesMap, raidBoss);
        }
      });
    }
  }
  else{

    message.channel.send("A member of your raid group is not a high enough level for this raid!");
  }
}

/**
* Raid lock all the characters.
*/
function raidLockCharacters(message, args, characters, activesMap, raidBoss){

  var charCount = 0;
  for(var x = 0; x < characters.length; x++){

    var character = characters[x];
    character.raidLock = true;
    var date = new Date();
    var currentTime = date.getTime();
    character.raidtime = currentTime;
    if(character.battlesLeft == 5){

      character.battletime = currentTime;
    }
    character.battlesLeft -= 1;
	  dbfunc.getDB().collection("characters").updateOne({"_id": character._id}, {$set: {"raidLock": character.raidLock}}, function(error, result){

      charCount++;
      if(charCount == characters.length){

        doRaid(message, args, characters, activesMap, raidBoss);
      }
    });
  }
}

/**
* Do the raid.
*/
function doRaid(message, args, characters, activesMap, boss){

  //Initialize boss stats
  boss.pow = boss.powBase;
  boss.wis = boss.wisBase;
  boss.skl = boss.sklBase;
  boss.spd = boss.spdBase;

  //Prebattle determinations
  var battleState = {};
  battleState.state = statefunc.RAID;
  battleState.phase = 0; //Increments only when a boss acts
  battleState.turn = 0; //Increments when either a character or boss acts

  battleState.turnValueMap = {};
  battleState.turnIds = [];
  battleState.turnIndex = 0;
  var beginRaidString = "";
  for(var x = 0; x < characters.length; x++){

    var character = characters[x];
    battleState.turnValueMap[character._id] = character.turn + boss.char_turn;
    battleState[character._id] = 0;
    battleState.turnIds.push(character._id);
    beginRaidString += message.guild.members.get(character._id).displayName;
    if(x != characters.length - 1) beginRaidString += ",";
    beginRaidString += " ";
  }
  //Init boss turn values
  battleState.turnValueMap[statefunc.RAID] = boss.turn;
  battleState.turnIds.push(statefunc.RAID);
  var hashave = "has ";
  if(battleState.turnIds.length > 2) hashave = "have ";
  beginRaidString += hashave + "begun a raid against " + boss.name + "!";

  message.channel.send(beginRaidString);
  recursiveRaidTurn(battleState, message, args, characters, activesMap, boss);
}

/**
* Determines what to do in the next turn.
*/
function recursiveRaidTurn(battleState, message, args, characters, activesMap, boss){

  setTimeout(function(){

    var alive = false;
    for(var x = 0; x < characters.length; x++){

      var character = characters[x];
      if(character.hp > 0){

        alive = true;
        break;
      }
    }
    if(alive){

      if(boss.hp > 0){

        var grumbo;
        var turnId;
        while(true){

          turnId = battleState.turnIds[battleState.turnIndex];
          //Get character or boss to get their SPD
          if(turnId != statefunc.RAID){

            for(var x = 0; x < characters.length; x++){

              grumbo = characters[x];
              if(battleState.turnIds[battleState.turnIndex] == grumbo._id) break;
            }
          }
          else{

            grumbo = boss;
          }

          battleState.turnValueMap[turnId] += RAID_BASE_PER_TURN + grumbo.spd;
          if(battleState.turnValueMap[turnId] < RAID_TURN_VALUE || grumbo.hp <= 0){

            battleState.turnIndex += 1;
            if(battleState.turnIndex >= battleState.turnIds.length) battleState.turnIndex = 0;
          }
          else{

            battleState.turnValueMap[turnId] -= RAID_TURN_VALUE;
            battleState.turnIndex += 1;
            if(battleState.turnIndex >= battleState.turnIds.length) battleState.turnIndex = 0;
            break;
          }
        }

        battleState.turn += 1;
        if(turnId != statefunc.RAID){

          battleState[grumbo._id] += 1;
          doCharacterTurn(battleState, message, args, characters, activesMap, boss, grumbo);
        }
        else{

          battleState.phase += 1;
          var raidActiveId = activeraidfunc[boss.id](battleState, message, args, characters, activesMap, boss);
          var raidActive = activeList[raidActiveId];
          if(raidActive.target != statefunc.MULTIPLE){

            //Do single target boss turn
            var target = activeraidfunc[boss.id][raidActiveId](battleState, message, args, characters, activesMap, boss);
            doBossTurnSingle(battleState, message, args, characters, activesMap, boss, target, raidActive);
          }
          else{

            //Do multiple target boss turn
            activeraidfunc[boss.id][raidActiveId](battleState, message, args, characters, activesMap, boss); //Prep active
            for(var y = 0; y < characters.length; y++){

              //Get all character active effects
              var character = characters[y];
              var activeCount = 0;
              dbfunc.getDB().collection("actives").find({"character": character._id}).toArray(function(err, actives){

                var active = actives[0];
                if(active != null){

                  activesMap[active.character] = actives;
                }
                activeCount++;
                if(activeCount == characters.length){

                  doBossTurnMultiple(battleState, message, args, characters, activesMap, boss, raidActive);
                }
              });
            }
          }
        }
      }
      else{

        battleState.raidWin = true;
        finishRaid(battleState, message, args, characters, activesMap, boss);
      }
    }
    else{

      battleState.raidWin = false;
      finishRaid(battleState, message, args, characters, activesMap, boss);
    }
  }, 2500);
}

/**
* Do a character's turn.
*/
function doCharacterTurn(battleState, message, args, characters, activesMap, boss, character){

  setTimeout(function(){

    dbfunc.getDB().collection("actives").find({"character": character._id}).toArray(function(err, actives){

      activesMap[character._id] = actives;
      battleState.turn_state = statefunc.CHARACTER;

      state.character_prebattle(message, args, character, battleState, actives, boss, characters);

      var username = message.guild.members.get(character._id).displayName;
      var preMessageString = "########## TURN " + battleState.turn + ": " + username + " ##########\n#\n" +
        "# " + username + "  HP  " + character.hp + "  |  " + boss.name + "  HP  " + boss.hp + "\n";
      battleState.preMessages.forEach(function(preMessage){

        preMessageString += "# " + preMessage + "\n";
      });
      preMessageString += "# Turn victory chance: " + battleState.chance + "%\n# ...";
      message.channel.send(preMessageString);

      doCharacterTurnResults(battleState, message, args, characters, activesMap, boss, character);
    });
  }, 1250);
}

/**
* Do a character's turn results.
*/
function doCharacterTurnResults(battleState, message, args, characters, activesMap, boss, character){

  setTimeout(function(){

    dbfunc.getDB().collection("actives").find({"character": character._id}).toArray(function(err, actives){

      activesMap[character._id] = actives;

      var username = message.guild.members.get(character._id).displayName;

      //Determine phase results
      battleState.result = Math.floor(Math.random() * (101));

      //Preresults determinations
      state.character_preresults(message, args, character, battleState, actives, boss, characters);

      var endMessageString = "";
      if(battleState.win) endMessageString += "# " + username + "'s attack was successful this turn!\n"; //Victory
      else endMessageString += "# " + username + " missed this turn! Your damage was massively reduced!\n"; //Loss

      //Postresults determinations
      state.character_postresults(message, args, character, battleState, actives, boss, characters);
      battleState.preResMessages.forEach(function(preResMessage){

        endMessageString += "# " + preResMessage + "\n";
      });
      battleState.endMessages.forEach(function(endMessage){

        endMessageString += "# " + endMessage + "\n";
      });
      if(battleState.hpLoss > 0){

        endMessageString += "# " + username + " took " + battleState.hpLoss + " damage!\n";
      }
      else if(battleState.hpLoss < 0){

        endMessageString += "# " + username + " recovered " + Math.abs(battleState.hpLoss) + " HP!\n";
      }
      endMessageString += "# " + username + " dealt " + battleState.dmgMod + " damage to " + boss.name + "!\n";
      endMessageString += "#\n";

      character.hp -= battleState.hpLoss;
      if(character.hp <= 0){

        character.hp = 0;
        endMessageString += "# " + username + " has been defeated!\n#\n";
      }
      else if(character.hp > character.maxHP) character.hp = character.maxHP;
      boss.hp -= battleState.dmgMod;
      if(boss.hp < 0) boss.hp = 0;
      else if(boss.hp > boss.max_hp) boss.hp = boss.max_hp;

      endMessageString += "# " + username + "  HP  " + character.hp + "  |  " + boss.name + "  HP  " + boss.hp + "\n#\n"
        + "############ END TURN " + battleState.turn + " ###########";

      message.channel.send(endMessageString);

      //Update character in list
      for(var x = 0; x < characters.length; x++){

        var listCharacter = characters[x];
        if(character._id == listCharacter._id){

          characters[x] = character;
          dbfunc.updateCharacter(character);
          break;
        }
      }

      recursiveRaidTurn(battleState, message, args, characters, activesMap, boss);
    });
  }, 4000);
}

/**
* Do single target boss turn.
*/
function doBossTurnSingle(battleState, message, args, characters, activesMap, boss, character, raidActive){

  setTimeout(function(){

    dbfunc.getDB().collection("actives").find({"character": character._id}).toArray(function(err, actives){

      activesMap[character._id] = actives;
      battleState.turn_state = statefunc.BOSS;

      state.boss_prebattle(message, args, character, battleState, actives, boss, characters, raidActive);

      var username = message.guild.members.get(character._id).displayName;
      var preMessageString = "########## TURN " + battleState.turn + ": " + boss.name + " ##########\n#\n" +
        "# " + boss.name + " has targeted " + username + " with " + raidActive.name + "!" + "\n" +
        "# " + username + "  HP  " + character.hp + "  |  " + boss.name + "  HP  " + boss.hp + "\n";
      battleState.preMessages.forEach(function(preMessage){

        preMessageString += "# " + preMessage + "\n";
      });
      preMessageString += "# ...";
      message.channel.send(preMessageString);

      doBossTurnSingleResults(battleState, message, args, characters, activesMap, boss, character, raidActive);
    });
  }, 1250);
}

/**
* Do single target boss turn.
*/
function doBossTurnSingleResults(battleState, message, args, characters, activesMap, boss, character, raidActive){

  setTimeout(function(){

    dbfunc.getDB().collection("actives").find({"character": character._id}).toArray(function(err, actives){

      activesMap[character._id] = actives;

      var username = message.guild.members.get(character._id).displayName;

      //Preresults determinations
      state.boss_preresults(message, args, character, battleState, actives, boss, characters, raidActive);
      //Postresults determinations
      state.boss_postresults(message, args, character, battleState, actives, boss, characters, raidActive);
      var endMessageString = "";
      battleState.preResMessages.forEach(function(preResMessage){

        endMessageString += "# " + preResMessage + "\n";
      });
      battleState.endMessages.forEach(function(endMessage){

        endMessageString += "# " + endMessage + "\n";
      });
      if(battleState.hpLoss > 0){

        endMessageString += "# " + username + " took " + battleState.hpLoss + " damage!\n";
      }
      else if(battleState.hpLoss < 0){

        endMessageString += "# " + username + " recovered " + Math.abs(battleState.hpLoss) + " HP!\n";
      }
      if(battleState.dmgMod > 0){

        endMessageString += "# " + username + " dealt " + battleState.dmgMod + " damage to " + boss.name + "!\n";
      }
      endMessageString += "#\n";

      character.hp -= battleState.hpLoss;
      if(character.hp <= 0){

        character.hp = 0;
        endMessageString += "# " + username + " has been defeated!\n#\n";
      }
      else if(character.hp > character.maxHP) character.hp = character.maxHP;
      boss.hp -= battleState.dmgMod;
      if(boss.hp < 0) boss.hp = 0;
      else if(boss.hp > boss.max_hp) boss.hp = boss.max_hp;

      endMessageString += "# " + username + "  HP  " + character.hp + "  |  " + boss.name + "  HP  " + boss.hp + "\n#\n"
        + "############ END TURN " + battleState.turn + " ###########";

      message.channel.send(endMessageString);

      //Update character in list
      for(var x = 0; x < characters.length; x++){

        var listCharacter = characters[x];
        if(character._id == listCharacter._id){

          characters[x] = character;
          dbfunc.updateCharacter(character);
          break;
        }
      }

      recursiveRaidTurn(battleState, message, args, characters, activesMap, boss);
    });
  }, 4000);
}

/**
* Do multiple target boss turn.
*/
function doBossTurnMultiple(battleState, message, args, characters, activesMap, boss, raidActive){

  setTimeout(function(){

    battleState.turn_state = statefunc.BOSS;
    var preMessageString = "########## TURN " + battleState.turn + ": " + boss.name + " ##########\n#\n" +
      "# " + boss.name + " has targeted multiple raid members with " + raidActive.name + "!" + "\n" +
      "# " + boss.name + "  HP  " + boss.hp + "\n#\n";
    message.channel.send(preMessageString);

    doBossTurnMultipleResults(battleState, message, args, characters, activesMap, boss, raidActive);

  }, 1750);
}

/**
* Do multiple target boss turn.
*/
function doBossTurnMultipleResults(battleState, message, args, characters, activesMap, boss, raidActive){

  setTimeout(function(){

    var endMessageString = "";
    for(var x = 0; x < characters.length; x++){

      var character = characters[x];
      if(character.hp > 0){

        var actives = activesMap[character._id];
        var username = message.guild.members.get(character._id).displayName;

        state.boss_prebattle(message, args, character, battleState, actives, boss, characters, raidActive);
        battleState.preMessages.forEach(function(preMessage){

          endMessageString += "# " + preMessage + "\n";
        });

        //Preresults determinations
        state.boss_preresults(message, args, character, battleState, actives, boss, characters, raidActive);
        //Postresults determinations
        state.boss_postresults(message, args, character, battleState, actives, boss, characters, raidActive);
        battleState.preResMessages.forEach(function(preResMessage){

          endMessageString += "# " + preResMessage + "\n";
        });
        battleState.endMessages.forEach(function(endMessage){

          endMessageString += "# " + endMessage + "\n";
        });
        if(battleState.hpLoss > 0){

          endMessageString += "# " + username + " took " + battleState.hpLoss + " damage!\n";
        }
        else if(battleState.hpLoss < 0){

          endMessageString += "# " + username + " recovered " + Math.abs(battleState.hpLoss) + " HP!\n";
        }
        if(battleState.dmgMod > 0){

          endMessageString += "# " + username + " dealt " + battleState.dmgMod + " damage to " + boss.name + "!\n";
        }

        character.hp -= battleState.hpLoss;
        if(character.hp <= 0){

          character.hp = 0;
          endMessageString += "# " + username + " has been defeated!\n";
        }
        else if(character.hp > character.maxHP) character.hp = character.maxHP;
        boss.hp -= battleState.dmgMod;
        if(boss.hp < 0) boss.hp = 0;
        else if(boss.hp > boss.max_hp) boss.hp = boss.max_hp;

        endMessageString += "# " + username + "  HP  " + character.hp + "\n#\n";

        //Update character in list
        characters[x] = character;
        dbfunc.updateCharacter(character);
      }
    }
    endMessageString += "# " + boss.name + "  HP  " + boss.hp + "\n#\n";
    endMessageString += "############ END TURN " + battleState.turn + " ###########";
    message.channel.send(endMessageString);

    recursiveRaidTurn(battleState, message, args, characters, activesMap, boss);
  }, 5000);
}

/**
* Finish the raid.
*/
function finishRaid(battleState, message, args, characters, activesMap, boss){

  var finishString = "";
  //WIN
  if(battleState.raidWin){

    finishString += boss.victory + "\n\n";
  }
  //LOSE
  else{

    finishString += boss.loss;
  }
  var totalLevel = 0;
  for(var i = 0; i < characters.length; i++){

    totalLevel += characters.level;
  }
  var avgLevel = totalLevel/characters.length;
  for(var x = 0; x < characters.length; x++){

    var character = characters[x];
    character.battleLock = false;
    character.raidLock = false;
    raids[character._id] = null;

    if(battleState.raidWin){

      var username = message.guild.members.get(character._id).displayName;
      var gain = boss.gold + Math.ceil(character.luk/100 * boss.gold);
      var lootcut = 0;
      if(avgLevel > boss.level + 15 && Math.abs(character.level - avgLevel) > 10 && character.level < boss.level + 15){

        gain = Math.ceil(boss.gold/4);
        lootcut = 25;
      }
      character.gold += gain;
      finishString += username + " gained " + gain + " gold!\n";

      //Create weighed array of loot
      var weighedLoot = [];
      for(var i = 0; i < boss.loot.length; i++){

        var id = boss.loot[i];
        var weight = boss.weights[i];
        for(var j = 0; j < weight; j++){

          weighedLoot.push(id);
        }
      }

      for(var l = 0; l < boss.lootchance.length; l++){

        var lootchance = boss.lootchance[l];
        var random = Math.random() * 100;
        if(random < lootchance + character.luk - lootcut){

          var lootrandom = Math.floor(Math.random() * (weighedLoot.length - 1));
          var lootedId = weighedLoot[lootrandom];
          //Receive loot
          if(lootedId != ""){

            var lootedItem = itemList[lootedId];
            if(lootedItem == null){

              //Equip
              lootedItem = equipList[lootedId];
              if(character.equips.includes(lootedItem.id)){

                character.gold += lootedItem.value;
                finishString += lootedItem.name + " yielded " + lootedItem.value + " gold!\n";
              }
              else{

                character.equips.push(lootedItem.id);
                finishString += username + " looted " + lootedItem.name + "!\n";
              }
            }
            else{

              //Item
              if(character.items.includes(lootedItem.id)){

                var hasCount = 0;
                for(var n = 0; n < character.items.length; n++){

                  var itemId = character.items[n];
                  if(itemId == lootedId) hasCount++;
                }
                if(hasCount >= lootedItem.max){

                  character.gold += lootedItem.value;
                  finishString += lootedItem.name + " yielded " + lootedItem.value + " gold!\n";
                }
                else{

                  character.items.push(lootedItem.id);
                  finishString += username + " looted " + lootedItem.name + "!\n";
                }
              }
              else{

                character.items.push(lootedItem.id);
                finishString += username + " looted " + lootedItem.name + "!\n";
              }
            }
          }
          //No loot
          else{

            finishString += "A loot attempt came up empty handed!\n";
          }
        }
      }

      finishString += "\n";
    }

    character.items.sort();
    character.equips.sort();

    //Save battle results
    dbfunc.updateCharacter(character);
  }

  message.channel.send(finishString);
}

/**
* Adds battle attempts to character if possible.
*/
exports.restockBattles = function(currentTime, character){

	var timeSinceLastBattle = currentTime - character.battletime;
	var addBattles = Math.floor(timeSinceLastBattle/charfunc.calculateWaitTime(character));
	if(addBattles > 0){

		character.battlesLeft += addBattles;
		if(character.battlesLeft < 5){

			character.battletime = character.battletime + (addBattles * charfunc.calculateWaitTime(character));
		}
		if(character.battlesLeft >= 5){

			character.battlesLeft = 5;
		}
	}

	dbfunc.updateCharacter(character);
}

/**
* Calculates the prebattle character mods.
*/
exports.calculateCharacterMods = function(message, args, character, battleState, actives, grumbo){

	exports.calculateHPMod(character, battleState);
	exports.calculatePOWMod(character, grumbo, battleState);
	exports.calculateWISMod(character, grumbo, battleState);
  exports.calculateSKLMod(character, grumbo, battleState);
}

/**
* Calculates the hp chance mod.
*/
exports.calculateHPMod = function(character, battleState){

  if(character.hp >= character.maxHP * 0.95){

		battleState.hpMod += 5;
	}
	else if(character.hp <= 0){

		battleState.hpMod -= 50;
	}
	else if(character.hp <= character.maxHP * 0.05){

		battleState.hpMod -= 25;
	}
	else if(character.hp <= character.maxHP * 0.20){

		battleState.hpMod -= 10;
	}
	else if(character.hp <= character.maxHP * 0.45){

		battleState.hpMod -= 5;
	}
}

/**
* Calculates the pow chance mod. Max 10 before actives.
*/
exports.calculatePOWMod = function(character, grumbo, battleState){

	battleState.powMod += Math.ceil((character.pow - grumbo.pow)/8);
	if(battleState.powMod > 25)	battleState.powMod = 25;
}

/**
* Calculates the wis chance mod. Max 10 before actives.
*/
exports.calculateWISMod = function(character, grumbo, battleState){

	battleState.wisMod += Math.ceil((character.wis - grumbo.wis)/12);
	if(battleState.wisMod > 25) battleState.wisMod = 25;
}

/**
* Calculates the skl chance mod. Max 50 before actives.
*/
exports.calculateSKLMod = function(character, grumbo, battleState){

	battleState.sklMod += Math.ceil((character.skl - grumbo.skl)/1.25);
	if(battleState.sklMod > 75) battleState.sklMod = 75;
}
