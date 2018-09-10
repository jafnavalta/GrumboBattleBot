//Initialize fs
const fs = require("fs");

//List of actives
let activesList = JSON.parse(fs.readFileSync("./values/actives.json", "utf8"));

exports.getActive = function(character, activeId){

  var active = activesList[activeId];
  active._id = character._id + activeId;
  active.character = character._id;
  return active;
}
