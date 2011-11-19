var GoogleWorld = require('../support/google_world');

var googleSteps = function() {
  var Given = When = Then = this.defineStep;
  this.World = GoogleWorld;

  Given(/^I am on Google$/, function(callback) {
    this.visitURL("http://www.google.com", callback);
  });

  When(/^I search for "(.*)"$/, function(query, callback) {
    this.query(query, callback);
  });

  Then(/^I see a link to "(.*)"$/, function(url, callback) {
    this.assertDisplayedLinkToURL(url, callback);
  });
};

module.exports = googleSteps;
