window.supportCode = function() {
  var Given = When = Then = this.defineStep;

  // --- STEP DEFS ---

  Given(/^I have nothing to do$/, function (callback) {
    this.haveNothingToDo(callback);
  });

  When(/^I add a new task$/, function (callback) {
    this.addTask(callback);
  });

  Then(/^I have some tasks to do$/, function (callback) {
    this.assertTaskCountEqual(1, callback);
  });

  // --- WORLD ---

  var World = function World() {
    this.browser = new FrameBrowser('#cucumber-browser');
  };
  this.World = World;

  // DSL

  World.prototype.haveNothingToDo = function (callback) {
    var reset = this.reset;
    this.runInSequence(
      reset,
      callback
    );
  };

  World.prototype.addTask = function (callback) {
    var visitRoot             = this.browser.visitUrl("/");
    var clickNewTaskLink      = this.browser.clickLink("New Task");
    var fillInTitle           = this.browser.fillIn("#task_title", "Write some code");
    var fillInContent         = this.browser.fillIn("#task_content", "Code is awesome.\nI want to write some more.");
    var clickCreateTaskButton = this.browser.clickButton("input[type='submit'][value='Create Task']");
    var waitForConfirmation   = function(callback) {
      this.browser.waitForSelector("p:contains('Task was successfully created.')", callback);
    };
    this.runInSequence(
      visitRoot,
      clickNewTaskLink,
      fillInTitle,
      fillInContent,
      clickCreateTaskButton,
      waitForConfirmation,
      callback
    );
  };

  World.prototype.assertTaskCountEqual = function (expectedTaskCount, callback) {
    var visitRoot   = this.browser.visitUrl("/");
    var waitForTask = function(callback) {
      this.browser.waitForSelector("tr.task", callback);
    };
    this.runInSequence(
      visitRoot,
      waitForTask,
      callback
    );
  };

  // helpers

  World.prototype.reset = function(callback) {
    var resetAllRemotely = RemoteCommand("reset_all");
    var visitRoot        = this.browser.visitUrl("/");
    this.runInSequence(
      resetAllRemotely,
      visitRoot,
      callback
    );
  };

  World.prototype.runInSequence = function() {
    var self      = this;
    var funcCalls = Array.prototype.slice.apply(arguments);
    var funcCall  = funcCalls.shift();
    if (funcCalls.length > 0) {
      var subCallback = function() { self.runInSequence.apply(self, funcCalls) };
      funcCall.call(self, subCallback);
    } else {
      funcCall.call(self);
    }
  };

  // Remote calls

  var getRemoteUrlForFunction = function (funcName) {
    return "/cukes/" + funcName;
  };

  var RemoteQuery = function RemoteQuery(funcName, data) {
    var self = this;

    return function(callback) {
      var url = getRemoteUrlForFunction(funcName);
      $.getJSON(url, data, function(results, textStatus, jqXHR) {
        callback(results);
      });
    };
  };

  var RemoteCommand = function RemoteCommand(funcName, data) {
    var self = this;

    return function(callback) {
      var url = getRemoteUrlForFunction(funcName);
      $.post(url, data, function(results, textStatus, jqXHR) {
        callback();
      });
    };
  };

  var FrameBrowser = function FrameBrowser(frameSelector) {
    var WAIT_FOR_TIMEOUT = 5000;
    var WAIT_FOR_DELAY   = 20;
    var $frame           = jQuery(frameSelector);
    window.f = $frame;

    function waitFor(subject, test, callback, errCallback) {
      var start = new Date().getTime();

      function check() {
        var now     = new Date().getTime();
        var elapsed = now - start;
        if (test()) {
          callback();
        } else if (elapsed > WAIT_FOR_TIMEOUT) {
          var error = new Error("Timed out waiting for " + subject);
          if (errCallback)
            errCallback(err);
          else
            throw error;
        } else {
          setTimeout(function() { check(callback); }, WAIT_FOR_DELAY);
        }
      };
      check(test, callback);
    };

    function _visitUrl(url) {
      if ($frame.attr('src') == url) {
        $frame.get()[0].contentWindow.location.reload();
      } else {
        $frame.attr('src', url);
      }
    };

    var self = {
      visitUrl: function (url) {
        return function visitUrl(callback) {
          _visitUrl(url);
          callback();
        };
      },

      fillIn: function (selector, value) {
        return function fillIn(callback) {
          self.waitForSelector(selector, function() {
            self.find(selector).val(value);
            callback();
          });
        };
      },

      clickLink: function (link) {
        return function clickLink(callback) {
          var selector = "a:contains('" + link.replace("'", "\\'") + "'):first";
          self.waitForSelector(selector, function() {
            var $a = self.find(selector);
            var href = $a.attr('href');
            $a.click();
            if (href)
              _visitUrl(href);
            callback();
          });
        };
      },

      clickButton: function (selector) {
        return function clickButton(callback) {
          self.waitForSelector(selector, function() {
            self.find(selector).click();
            callback();
          });
        };
      },

      waitForSelector: function (selector, callback) {
        waitFor(
          "selector \"" + selector + "\"",
          function() {
            var elements = self.find(selector);
            var found    = elements.length > 0;
            return found;
          },
          callback
        );
      },

      find: function (selector) {
        var $elements = $frame.contents().find(selector);
        return $elements;
      }
    };
    return self;
  };
};
