var zombie = require("zombie");
var HTML5  = require("html5").HTML5

var MyWorld = function() {
  this.browser = new zombie.Browser({runScripts:true, debug:false, htmlParser: HTML5});
};

module.exports = MyWorld;
