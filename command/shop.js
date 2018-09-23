//Initialize DB functions
let dbfunc = require('../data/db.js');

//Initialize fs
const fs = require("fs");

//Initialize list of items file
let itemList = JSON.parse(fs.readFileSync("./values/items.json", "utf8"));
let rotationList = JSON.parse(fs.readFileSync("./values/rotation_items_list.json", "utf8"));
let specialList = JSON.parse(fs.readFileSync("./values/special_items_list.json", "utf8"));
let equipList = JSON.parse(fs.readFileSync("./values/equips.json", "utf8"));
let activeList = JSON.parse(fs.readFileSync("./values/actives.json", "utf8"));
let LR = JSON.parse(fs.readFileSync("./values/shop_lastrotation.json", "utf8")); //Set value in this file to 0 to force shop rotation

//Initialize state for state constants and functions
let state = require('../state.js');

//Weighted Arrays for randomly choosig items for rotation/special/equip shop
let weighedRotation = [];
let weighedSpecial = [];
let weighedEquip = [];

const INTERVAL = 10800000 //3 hours in millis
const ROTATION_LIMIT = 3;
const SPECIAL_LIMIT = 3;
const EQUIP_LIMIT = 3;

//Init shop
let standardShop = JSON.parse(fs.readFileSync("./values/shop_standard.json", "utf8"));
let shop = {
	standard: [],
	rotation: [],
	special: [],
	equip: []
}

/**
* Fill the weighted arrays.
*/
exports.initWeighedArrays = function(){

	for(var key in rotationList){

		var rotationItem = rotationList[key];
		for(var i = 0; i < rotationItem.weight; i++){

			weighedRotation.push(rotationItem.id);
		}
	};
	for(var key in specialList){

		var specialItem = specialList[key];
		for(var i = 0; i < specialItem.weight; i++){

			weighedSpecial.push(specialItem.id);
		}
	};
	for(var key in equipList){

		var equip = equipList[key];
		for(var i = 0; i < equip.weight; i++){

			weighedEquip.push(equip.id);
		}
	};
}

exports.commandShop = function(message, args, character){

	//Display shop
	if(args.length == 2 || (args.length == 3 && args[2] == '-d')){

		//Update then display
		updateShop(function(){ displayShop(message, args, character) });
	}

	//Buy an item
	else if(args[2] == 'buy' && (args.length == 4 || (args.length == 5 && isInteger(args[4])))){

		//Update then buy
		updateShop(function(){ buy(message, args, character) });
	}

	//Sell an item
	else if(args[2] == 'sell' && (args.length == 4 || (args.length == 5 && isInteger(args[4])))){

		sell(message, args, character);
	}

	//Bad command
	else{

		message.channel.send("Bad shop command. Try '!grumbo help' for the correct command.");
	}
}

/**
* Update shop.
* If shop is empty, initialize shop.
* Update rotation/special based on timed intervals.
*/
function updateShop(shopFunction){

	//Init shop if empty
	if(shop.standard.length == 0){

		initShop(function(){ shopFunction() });
	}
	else{

		updateRotationSpecialEquip(function(){ shopFunction() });
	}
}

/**
* Initialize shop.
*/
function initShop(shopFunction){

	shop.standard = standardShop;
	dbfunc.getDB().collection("shop_equip").find().toArray(function(err, equip){

		if(equip != null){

			for(var i = 0; i < equip.length; i++){

				var equipItem = equip[i];
				shop.equip.push(equipItem);
			}
		}
		dbfunc.getDB().collection("shop_rotation").find().toArray(function(err, rotation){

			if(rotation != null){

				for(var i = 0; i < rotation.length; i++){

					var rotationItem = rotation[i];

					shop.rotation.push(rotationItem);
				}
			}
			dbfunc.getDB().collection("shop_special").find().toArray(function(err, special){

				if(special != null){

					for(var i = 0; i < special.length; i++){

						var specialItem = special[i];

						shop.special.push(specialItem);
					}
				}
				updateRotationSpecialEquip(function(){ shopFunction() });
			});
		});
	})
}

/**
* Update shop rotation/special/equip based on timed intervals.
*/
function updateRotationSpecialEquip(shopFunction){

	var date = new Date();
	var currentTime = date.getTime();
	var currentRotation = Math.floor(currentTime/INTERVAL);
	if(currentRotation > LR.lastRotation || shop.equip.length <= 0){ //Equip shop check for DB version 6+ when equips were added

		itemList = JSON.parse(fs.readFileSync("./values/items.json", "utf8"));
		rotationList = JSON.parse(fs.readFileSync("./values/rotation_items_list.json", "utf8"));
		specialList = JSON.parse(fs.readFileSync("./values/special_items_list.json", "utf8"));
		equipList = JSON.parse(fs.readFileSync("./values/equips.json", "utf8"));
		LR.lastRotation = currentRotation;
		fs.writeFileSync("./values/shop_lastrotation.json", JSON.stringify(LR, null, 4));

		//Randomize new rotation/special/equip shops
		dbfunc.getDB().collection("shop_rotation").deleteMany({}, function(err, result){

			dbfunc.getDB().collection("shop_special").deleteMany({}, function(err, result){

				dbfunc.getDB().collection("shop_equip").deleteMany({}, function(err, result){

					shop.rotation = [];
					shop.special = [];
					shop.equip = [];

					//Populate rotation
					while(shop.rotation.length < ROTATION_LIMIT){

						var random = Math.floor(Math.random() * (weighedRotation.length - 1));
						var rotationId = weighedRotation[random];
						var included = false;
						for(var i = 0; i < shop.rotation.length; i++){

							if(shop.rotation[i].id == rotationId){

								included = true;
								break;
							}
						};
						if(!included){

							var item = rotationList[rotationId];
							item.shop = "rotation";
							shop.rotation.push(item);
						}
					}

					//Populate special
					while(shop.special.length < SPECIAL_LIMIT){

						var random = Math.floor(Math.random() * (weighedSpecial.length - 1));
						var specialId = weighedSpecial[random];
						var included = false;
						for(var i = 0; i < shop.special.length; i++){

							if(shop.special[i].id == specialId){

								included = true;
								break;
							}
						};
						if(!included){

							var item = specialList[specialId];
							item.shop = "special";
							shop.special.push(item);
						}
					}

					//Populate equip
					while(shop.equip.length < EQUIP_LIMIT){

						var random = Math.floor(Math.random() * (weighedEquip.length - 1));
						var equipId = weighedEquip[random];
						var included = false;
						for(var i = 0; i < shop.equip.length; i++){

							if(shop.equip[i].id == equipId){

								included = true;
								break;
							}
						};
						if(!included){

							var item = equipList[equipId];
							item.shop = "equip";
							shop.equip.push(item);
						}
					}

					//Update db with new rotation/special/equip and then perform shop function
					dbfunc.updateRotationSpecialEquip(shop.rotation, shop.special, shop.equip, function(){ shopFunction() });
				});
			});
		});
	}
	else{

		//No need to update, do given shop function
		shopFunction();
	}
}

/**
* Display shop.
*/
function displayShop(message, args, character){

	//DM user
	var sender = message.author;
	if(args.length == 3){

		//Message channel
		sender = message.channel;
	}

	var shopString = "---------- THE GRUMBO SHOP ----------\n " + message.member.displayName + ": " + character.gold + " gold\n"
		+ "|\n[--- STANDARD ITEMS ---]";
	shop.standard.forEach(function(itemId){

		var item = itemList[itemId];
		shopString += "\n|\n" + item.name + "  |  Buy:  " + item.id + "\n"
			+ item.description + "\n";
		shopString += "Price: " + item.price + " gold  |  ";
		if(item.max > 1){

			shopString += "Can hold up to " + item.max;
		}
		else{

			shopString += "Can only hold 1";
		}
	});

	sender.send(shopString);

	var currentTime = new Date().getTime();
	var timeUntilRotationInMillis = (INTERVAL * (LR.lastRotation + 1)) - currentTime;
	var hours = Math.floor(timeUntilRotationInMillis/3600000);
	var minutes = Math.ceil((timeUntilRotationInMillis % 3600000) / 60000);

	var shopString2 = "|\n[--- ROTATING ITEMS ---]\nThe next rotation is in " + hours + " hours " + minutes + " minutes";
	shop.rotation.forEach(function(item){

		shopString2 += "\n|\n" + item.name + "  |  Buy:  " + item.id + "\n"
			+ item.description + "\n";
		shopString2 += "Price: " + item.price + " gold  |  ";
		if(item.max > 1){

			shopString2 += "Can hold up to " + item.max + "\n";
		}
		else{

			shopString2 += "Can only hold 1\n";
		}
		shopString2 += "Stock: " + item.stock;
	});

	sender.send(shopString2);

	var shopString3 = "|\n[--- SPECIALS ---]\nThe next rotation is in " + hours + " hours " + minutes + " minutes";
	shop.special.forEach(function(special){

		shopString3 += "\n|\n" + special.name + "  |  Buy:  " + special.id + "\n"
			+ special.description + "\n";
		var itemsString = "Contains: [";
		for(var i = 0; i < special.items.length; i++){

			if(i == special.items.length - 1){

				itemsString += itemList[special.items[i]].name + "]\n";
			}
			else{

				itemsString += itemList[special.items[i]].name + ", ";
			}
		}
		shopString3 += itemsString;
		shopString3 += "Price: " + special.price + " gold\n"
			+ "Stock: " + special.stock;
	});

	sender.send(shopString3);

	var shopString4 = "|\n[--- EQUIPS ---]\nThe next rotation is in " + hours + " hours " + minutes + " minutes";
	shop.equip.forEach(function(equipItem){

		shopString4 += "\n|\n" + equipItem.name + "  |  Lv Req: " + equipItem.level + "  |  Buy:  " + equipItem.id + "\n"
			+ equipItem.description + "\nActive: ";
		var activeString;
		if(equipItem.active == null) activeString = "None\n";
		else activeString = activeList[equipItem.active].name + "\n";
		shopString4 += activeString;
		shopString4 += "Price: " + equipItem.price + " gold";
		if(equipItem.stock != null){

			shopString4 += "\nStock: " + equipItem.stock;
		}
	});

	sender.send(shopString4);
}

/**
* Buy from shop.
*/
function buy(message, args, character){

	var buyItem = args[3];
	var amount = 1;
	if(args.length == 5) amount = args[4];

	var item;
	if(shop.standard.includes(buyItem)){

		item = itemList[buyItem];
		buyStandardItem(message, character, item, amount);
	}
	else{

		var rotationIncluded = false;
		for(var i = 0; i < shop.rotation.length; i++){

			var rotationItem = shop.rotation[i];
			if(rotationItem.id == buyItem){

				item = rotationItem;
				rotationIncluded = true;
				break;
			}
		}
		if(rotationIncluded){

			buyRotationItem(message, character, item, amount);
		}
		else{

			var specialIncluded = false;
			for(var i = 0; i < shop.special.length; i++){

				var specialItem = shop.special[i];
				if(specialItem.id == buyItem){

					item = specialItem;
					specialIncluded = true;
					break;
				}
			}
			if(specialIncluded){

				buySpecialItem(message, character, item, amount);
			}
			else{

				var equipIncluded = false;
				for(var i = 0; i < shop.equip.length; i++){

					var equipItem = shop.equip[i];
					if(equipItem.id == buyItem){

						item = equipItem;
						equipIncluded = true;
						break;
					}
				}
				if(equipIncluded){

					buyEquipItem(message, character, item);
				}
				else{

					message.channel.send(buyItem + " is not an available shop item at this time.");
				}
			}
		}
	}
}

/**
* Buy from the standard shop.
*/
function buyStandardItem(message, character, item, amount){

	if(character.gold > (item.price * amount)){

		var hasCount = 0;
		character.items.forEach(function(charItem){

			if(charItem == item.id) hasCount++;
		});

		if((hasCount + parseInt(amount)) <= item.max){

			for(var i = 0; i < amount; i++){

				character.items.push(item.id);
			}

			var spent = item.price * amount;
			character.gold -= Math.ceil(spent);
			character.items.sort();
			dbfunc.updateCharacter(character);

			message.channel.send(message.member.displayName + " has bought x" + amount + " " + item.name + "(s) with " + spent + " gold!\n"
				+ "You now have " + character.gold + " gold");
		}
		else{

			//Too many to hold
			message.channel.send(message.member.displayName + ", you can only hold up to " + item.max + " " + item.name + "(s)");
		}
	}
	else{

		//Not enough gold
		message.channel.send(message.member.displayName + ", you do not have enough gold to buy x" + amount + " " + item.name + "(s)");
	}
}

/**
* Buy from the rotation shop.
*/
function buyRotationItem(message, character, item, amount){

	if(character.gold > (item.price * amount)){

		var hasCount = 0;
		character.items.forEach(function(charItem){

			if(charItem == item.id) hasCount++;
		});

		if(item.stock < amount){

			message.channel.send("Sorry! There aren't enough " + item.name + "(s) in stock.");
		}
		else if((hasCount + parseInt(amount)) <= item.max){

			for(var i = 0; i < amount; i++){

				character.items.push(item.id);
			}

			var spent = item.price * amount;
			character.gold -= Math.ceil(spent);
			character.items.sort();
			dbfunc.updateCharacter(character);

			item.stock -= amount;
			dbfunc.updateRotationItem(item);

			message.channel.send(message.member.displayName + " has bought x" + amount + " " + item.name + "(s) with " + spent + " gold!\n"
				+ "You now have " + character.gold + " gold");
		}
		else{

			//Too many to hold
			message.channel.send(message.member.displayName + ", you can only hold up to " + item.max + " " + item.name + "(s)");
		}
	}
	else{

		//Not enough gold
		message.channel.send(message.member.displayName + ", you do not have enough gold to buy x" + amount + " " + item.name + "(s)");
	}
}

/**
* Buy from the special shop.
*/
function buySpecialItem(message, character, special, amount){

	if(character.gold > (special.price * amount)){

		if(special.stock < amount){

			message.channel.send("Sorry! There aren't enough " + special.name + "(s) in stock.");
		}
		else{

			var canHold = true;
			var unique = [...new Set(special.items)];
			for(var x = 0; x < unique.length; x++){

				var uniqueItem = unique[x]
				var countInSpecial = 0;
				special.items.forEach(function(uniqueItem2){

					if(uniqueItem == uniqueItem2) countInSpecial++;
				});

				var hasCount = 0;
				character.items.forEach(function(charItem){

					if(charItem == uniqueItem) hasCount++;
				});

				if(hasCount + (countInSpecial * amount) > itemList[uniqueItem].max){

					canHold = false;
					break;
				}
			};

			if(canHold){

				for(var i = 0; i < amount; i++){

					for(var j = 0; j < special.items.length; j++){

						character.items.push(special.items[j]);
					}
				}

				var spent = special.price * amount;
				character.gold -= Math.ceil(spent);
				character.items.sort();
				dbfunc.updateCharacter(character);

				special.stock -= amount;
				dbfunc.updateSpecialItem(special);

				message.channel.send(message.member.displayName + " has bought x" + amount + " " + special.name + "(s) with " + spent + " gold!\n"
					+ "You now have " + character.gold + " gold");
			}
			else{

				//Too many to hold
				message.channel.send(message.member.displayName + ", you don't have enough space for x" + amount + " " + special.name + "(s)");
			}
		}
	}
	else{

		//Not enough gold
		message.channel.send(message.member.displayName + ", you do not have enough gold to buy x" + amount + " " + special.name + "(s)");
	}
}

/**
* Buy from the equip shop.
*/
function buyEquipItem(message, character, equip){

	if(character.gold > equip.price){

		if(equip.stock != null && equip.stock <= 0){

			message.channel.send("Sorry! " + equip.name + " is out of stock.");
		}
		else{

			if(character.equips.includes(equip.id)){

				message.channel.send("You already own " + equip.name + " " + message.member.displayName);
			}
			else{

				character.equips.push(equip.id);
				var spent = equip.price * 1;
				character.gold -= Math.ceil(spent);
				character.equips.sort();
				dbfunc.updateCharacter(character);

				if(equip.stock != null){

					equip.stock -= 1;
					dbfunc.updateEquipItem(equip);
				}

				message.channel.send(message.member.displayName + " has bought " + equip.name + " with " + spent + " gold!\n"
					+ "You now have " + character.gold + " gold");
			}
		}
	}
	else{

		//Not enough gold
		message.channel.send(message.member.displayName + ", you do not have enough gold to buy " + equip.name);
	}
}

/**
* Sell to shop.
*/
function sell(message, args, character){

	var sellItem = args[3];
	//If an item
	if(character.items.includes(sellItem)){

		var amount = 1;
		var hasEnough = character.items.includes(sellItem);
		if(args.length == 5 && hasEnough){

			amount = args[4];
			//Count how much the user has of that particular item
			var count = 0;
			for(var i = 0; i < character.items.length; ++i){

				if(character.items[i] == sellItem) count++;
			}
			if(amount > count) hasEnough = false;
		}

		if(hasEnough){

			var totalGold = 0;
			var details = itemList[sellItem];
			var sellGold = details.value;

			//Sell given amount of item
			for(var i = 0; i < amount; i++){

				totalGold += sellGold;
				var index = character.items.indexOf(sellItem);
				character.items.splice(index, 1);
			}
			character.gold += totalGold;

			message.channel.send(message.member.displayName + " sold " + details.name + " x" + amount + " for " + totalGold + " gold!");

			//Save character
			dbfunc.updateCharacter(character);
		}
	}
	else if(character.equips.includes(sellItem)){

		var details = equipList[sellItem];
		var sellGold = details.value;
		var index = character.equips.indexOf(sellItem);
		character.equips.splice(index, 1);
		character.gold += sellGold;

		//Unequip if equipped right now
		if(details.id == character.head || details.id == character.armor || details.id == character.bottom || details.id == character.weapon){

			state.unequip(message, character, details);
		}

		message.channel.send(message.member.displayName + " sold " + details.name + " for " + sellGold + " gold!");

		dbfunc.updateCharacter(character);
	}
	else{

		message.channel.send("You do not have enough of the item: " + sellItem);
	}
}

/**
* Determines if x is an integer.
*/
function isInteger(x){

	return !isNaN(x) && (x % 1 === 0);
}
