var CucumberJsExampleWorld = require('../support/world').World;

var googleSteps = function() {
  var Given = When = Then = this.defineStep;
  this.World = CucumberJsExampleWorld;

  Given(/^I am on Google$/, function(callback) {
    this.google.visitGoogle(callback);
  });

  When(/^I search for "(.*)"$/, function(query, callback) {
    this.google.query(query, callback);
  });

  Then(/^I see a link to "(.*)"$/, function(url, callback) {
    this.google.assertDisplayedLinkToURL(url, callback);
  });
};

module.exports = googleSteps;
