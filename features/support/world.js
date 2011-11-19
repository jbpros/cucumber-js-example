var GoogleLand = require('./google_land').Land;

var CucumberJsExampleWorld = function() {
  this.google = new GoogleLand();
};
exports.World = CucumberJsExampleWorld;
