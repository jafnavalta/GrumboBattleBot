//Initialize class functions
let classAdventurer = require('./adventurer.js');
let classWarrior = require('./warrior.js');
let classMagician = require('./magician.js');
let classRogue = require('./rogue.js');
let classCleric = require('./cleric.js');
let classKnight = require('./knight.js');

exports.classes = {
  adventurer: classAdventurer,
  warrior: classWarrior,
  magician: classMagician,
  rogue: classRogue,
  cleric: classCleric,
  knight: classKnight
}
