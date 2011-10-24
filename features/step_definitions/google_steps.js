var assert  = require("assert");
var MyWorld = require('../support/my_world');

var googleSteps = function() {
  var Given = When = Then = this.defineStep;
  this.World = MyWorld;

  Given(/^I am on Google$/, function(callback) {
    this.browser.visit(
      "http://www.google.com",
      function(err, browser, status) {
        if (err)
          throw new Error(err.message);
        callback();
      }
    );
  });

  When(/^I search for "(.*)"$/, function(query, callback) {
    this.browser
      .fill("q", query)
      .pressButton(
        "btnG",
        function(err) {
          if (err)
            throw new Error(err.message);
          callback();
        }
      );
  });

  Then(/^I see a link to "(.*)"$/, function(url, callback) {
    var linksToUrl = this.browser.css("a[href='" + url + "']");
    assert.ok(linksToUrl.length > 0);
    callback();
  });
};

module.exports = googleSteps;
