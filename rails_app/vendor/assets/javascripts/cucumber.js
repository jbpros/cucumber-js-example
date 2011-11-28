var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}
var __require = require;

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee"];

require.resolve = (function () {
    var core = {
        'assert': true,
        'events': true,
        'fs': true,
        'path': true,
        'vm': true
    };
    
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (core[x]) return x;
        var path = require.modules.path();
        var y = cwd || '.';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = Object_keys(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key)
    return res;
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = function (fn) {
    setTimeout(fn, 0);
};

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

require.modules["path"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = ".";
    var __filename = "path";
    
    var require = function (file) {
        return __require(file, ".");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, ".");
    };
    
    require.modules = __require.modules;
    __require.modules["path"]._cached = module.exports;
    
    (function () {
        function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};
;
    }).call(module.exports);
    
    __require.modules["path"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/cucumber-html/package.json"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/cucumber-html";
    var __filename = "/node_modules/cucumber-html/package.json";
    
    var require = function (file) {
        return __require(file, "/node_modules/cucumber-html");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/cucumber-html");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/cucumber-html/package.json"]._cached = module.exports;
    
    (function () {
        module.exports = {"author":"Aslak Hellesøy <aslak.hellesoy@gmail.com>","contributors":["Cédric Lamalle <cedric.lamalle@gmail.com>","Julien Biezemans <jb@jbpros.com>"],"name":"cucumber-html","description":"Cross platform HTML formatter for all implementations of Cucumber","version":"0.2.0","homepage":"https://github.com/cucumber/cucumber-html","repository":{"type":"git","url":"git://github.com/cucumber/cucumber-html.git"},"main":"./src/main/resources/cucumber/formatter/formatter","engines":{"node":"*"},"dependencies":{},"devDependencies":{}};
    }).call(module.exports);
    
    __require.modules["/node_modules/cucumber-html/package.json"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/cucumber-html/src/main/resources/cucumber/formatter/formatter.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/cucumber-html/src/main/resources/cucumber/formatter";
    var __filename = "/node_modules/cucumber-html/src/main/resources/cucumber/formatter/formatter.js";
    
    var require = function (file) {
        return __require(file, "/node_modules/cucumber-html/src/main/resources/cucumber/formatter");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/cucumber-html/src/main/resources/cucumber/formatter");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/cucumber-html/src/main/resources/cucumber/formatter/formatter.js"]._cached = module.exports;
    
    (function () {
        var CucumberHTML = {};

CucumberHTML.DOMFormatter = function(rootNode) {
  var currentUri;
  var currentFeature;
  var currentElement;
  var currentSteps;

  var currentStepIndex;
  var currentStep;
  var $templates = $(CucumberHTML.templates);

  this.uri = function(uri) {
    currentUri = uri;
  };

  this.feature = function(feature) {
    currentFeature = blockElement(rootNode, feature, 'feature');
  };

  this.background = function(background) {
    currentElement = featureElement(background, 'background');
    currentStepIndex = 1;
  };

  this.scenario = function(scenario) {
    currentElement = featureElement(scenario, 'scenario');
    currentStepIndex = 1;
  };

  this.scenarioOutline = function(scenarioOutline) {
    currentElement = featureElement(scenarioOutline, 'scenario_outline');
    currentStepIndex = 1;
  };

  this.step = function(step) {
    var stepElement = $('.step', $templates).clone();
    stepElement.appendTo(currentSteps);
    populate(stepElement, step, 'step');

    if (step.doc_string) {
      docString = $('.doc_string', $templates).clone();
      docString.appendTo(stepElement);
      // TODO: use a syntax highlighter based on the content_type
      docString.text(step.doc_string.value);
    }
    if (step.rows) {
      dataTable = $('.data_table', $templates).clone();
      dataTable.appendTo(stepElement);
      var tBody = dataTable.find('tbody');
      $.each(step.rows, function(index, row) {
        var tr = $('<tr></tr>').appendTo(tBody);
        $.each(row.cells, function(index, cell) {
          var td = $('<td>' + cell + '</td>').appendTo(tBody);
        });
      });
    }
  };

  this.examples = function(examples) {
    var examplesElement = blockElement(currentElement.children('details'), examples, 'examples');
    var examplesTable = $('.examples_table', $templates).clone();
    examplesTable.appendTo(examplesElement.children('details'));

    $.each(examples.rows, function(index, row) {
      var parent = index == 0 ? examplesTable.find('thead') : examplesTable.find('tbody');
      var tr = $('<tr></tr>').appendTo(parent);
      $.each(row.cells, function(index, cell) {
        var td = $('<td>' + cell + '</td>').appendTo(tr);
      });
    });
  };

  this.match = function(match) {
    currentStep = currentSteps.find('li:nth-child(' + currentStepIndex + ')');
    currentStepIndex++;
  };

  this.result = function(result) {
    currentStep.addClass(result.status);
    currentElement.addClass(result.status);
    var isLastStep = currentSteps.find('li:nth-child(' + currentStepIndex + ')').length == 0;
    if(isLastStep) {
      if(currentSteps.find('.failed').length == 0) {
        // No failed steps. Collapse it.
        currentElement.find('details').removeAttr('open');
      }
    }
  };

  this.embedding = function(mimeType, data) {
    if(mimeType.match(/^image\//)) {
      currentStep.append("<div><img src='" + data + "'></div>");
    }
  }

  function featureElement(statement, itemtype) {
    var e = blockElement(currentFeature.children('details'), statement, itemtype);

    currentSteps = $('.steps', $templates).clone();
    currentSteps.appendTo(e.children('details'));

    return e;
  }

  function blockElement(parent, statement, itemtype) {
    var e = $('.blockelement', $templates).clone();
    e.appendTo(parent);
    return populate(e, statement, itemtype);
  }

  function populate(e, statement, itemtype) {
    populateTags(e, statement.tags);
    populateComments(e, statement.comments);
    e.find('.keyword').text(statement.keyword);
    e.find('.name').text(statement.name);
    e.find('.description').text(statement.description);
    e.attr('itemtype', 'http://cukes.info/microformat/' + itemtype);
    e.addClass(itemtype);
    return e;
  }

  function populateComments(e, comments) {
    if (comments !== undefined) {
      var commentsNode = $('.comments', $templates).clone().prependTo(e.find('.header'));
      $.each(comments, function(index, comment) {
        var commentNode = $('.comment', $templates).clone().appendTo(commentsNode);
        commentNode.text(comment.value);
      });
    }
  }

  function populateTags(e, tags) {
    if (tags !== undefined) {
      var tagsNode = $('.tags', $templates).clone().prependTo(e.find('.header'));
      $.each(tags, function(index, tag) {
        var tagNode = $('.tag', $templates).clone().appendTo(tagsNode);
        tagNode.text(tag.name);
      });
    }
  }
};

CucumberHTML.templates = '<div>\
  <section class="blockelement" itemscope>\
    <details open>\
      <summary class="header">\
        <span class="keyword" itemprop="keyword">Keyword</span>: <span itemprop="name" class="name">This is the block name</span>\
      </summary>\
      <div itemprop="description" class="description">The description goes here</div>\
    </details>\
  </section>\
\
  <ol class="steps"></ol>\
\
  <ol>\
    <li class="step"><span class="keyword" itemprop="keyword">Keyword</span><span class="name" itemprop="name">Name</span></li>\
  </ol>\
\
  <pre class="doc_string"></pre>\
\
  <table class="data_table">\
    <tbody>\
    </tbody>\
  </table>\
\
  <table class="examples_table">\
    <thead></thead>\
    <tbody></tbody>\
  </table>\
\
  <section class="embed">\
    <img itemprop="screenshot" class="screenshot" />\
  </section>\
  <div class="tags"></div>\
  <span class="tag"></span>\
  <div class="comments"></div>\
  <div class="comment"></div>\
<div>';

if (typeof module !== 'undefined') {
  module.exports = CucumberHTML;
};
    }).call(module.exports);
    
    __require.modules["/node_modules/cucumber-html/src/main/resources/cucumber/formatter/formatter.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/";
    var __filename = "/cucumber.js";
    
    var require = function (file) {
        return __require(file, "/");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber.js"]._cached = module.exports;
    
    (function () {
        var Cucumber = function(featureSource, supportCodeInitializer) {
  var configuration = Cucumber.VolatileConfiguration(featureSource, supportCodeInitializer);
  var runtime       = Cucumber.Runtime(configuration);
  return runtime;
};
Cucumber.Ast                   = require('./cucumber/ast');
// browserify won't load ./cucumber/cli and throw an exception:
try { Cucumber.Cli             = require('./cucumber/cli'); } catch(e) {}
Cucumber.Debug                 = require('./cucumber/debug'); // Untested namespace
Cucumber.Listener              = require('./cucumber/listener');
Cucumber.Parser                = require('./cucumber/parser');
Cucumber.Runtime               = require('./cucumber/runtime');
Cucumber.SupportCode           = require('./cucumber/support_code');
Cucumber.Type                  = require('./cucumber/type');
Cucumber.Util                  = require('./cucumber/util');
Cucumber.VolatileConfiguration = require('./cucumber/volatile_configuration');
module.exports                 = Cucumber;
;
    }).call(module.exports);
    
    __require.modules["/cucumber.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/ast.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber";
    var __filename = "/cucumber/ast.js";
    
    var require = function (file) {
        return __require(file, "/cucumber");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/ast.js"]._cached = module.exports;
    
    (function () {
        var Ast        = {};
Ast.Background = require('./ast/background');
Ast.DataTable  = require('./ast/data_table');
Ast.DocString  = require('./ast/doc_string');
Ast.Feature    = require('./ast/feature');
Ast.Features   = require('./ast/features');
Ast.Scenario   = require('./ast/scenario');
Ast.Step       = require('./ast/step');
module.exports = Ast;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/ast.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/ast/background.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/ast";
    var __filename = "/cucumber/ast/background.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/ast");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/ast");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/ast/background.js"]._cached = module.exports;
    
    (function () {
        var Background = function(keyword, name, description, line) {
  var Cucumber = require('../../cucumber');

  var steps = Cucumber.Type.Collection();

  var self = {
    getKeyword: function getKeyword() {
      return keyword;
    },

    getName: function getName() {
      return name;
    },

    getDescription: function getDescription() {
      return description;
    },

    getLine: function getLine() {
      return line;
    },

    addStep: function addStep(step) {
 	    steps.add(step);
 	  },

    getLastStep: function getLastStep() {
      return steps.getLast();
    },

 	  getSteps: function getSteps() {
      return steps;
 	  }
  };
  return self;
};
module.exports = Background;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/ast/background.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/ast/data_table.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/ast";
    var __filename = "/cucumber/ast/data_table.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/ast");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/ast");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/ast/data_table.js"]._cached = module.exports;
    
    (function () {
        var DataTable  = function() {
  var Cucumber = require('../../cucumber');

  var rows = Cucumber.Type.Collection();

  var self = {
    attachRow: function attachRow(row) {
      rows.add(row);
    },

    getContents: function getContents() {
      return self;
    },

    raw: function raw() {
      rawRows = [];
      rows.syncForEach(function(row) {
        var rawRow = row.raw();
        rawRows.push(rawRow);
      });
      return rawRows;
    },

    hashes: function hashes() {
      var raw              = self.raw();
      var hashDataTable    = Cucumber.Type.HashDataTable(raw);
      var rawHashDataTable = hashDataTable.raw();
      return rawHashDataTable;
    }
  };
  return self;
};
DataTable.Row  = require('./data_table/row');
module.exports = DataTable;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/ast/data_table.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/ast/data_table/row.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/ast/data_table";
    var __filename = "/cucumber/ast/data_table/row.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/ast/data_table");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/ast/data_table");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/ast/data_table/row.js"]._cached = module.exports;
    
    (function () {
        var Row = function(cells, line) {
  var Cucumber = require('../../../cucumber');

  self = {
    raw: function raw() {
      return cells;
    }
  };
  return self;
}
module.exports = Row;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/ast/data_table/row.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/ast/doc_string.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/ast";
    var __filename = "/cucumber/ast/doc_string.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/ast");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/ast");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/ast/doc_string.js"]._cached = module.exports;
    
    (function () {
        var DocString = function(contentType, contents, line) {
  var self = {
    getContents: function getContents() {
      return contents;
    },

    getContentType: function getContentType() {
      return contentType;
    },

    getLine: function getLine() {
      return line;
    }
  };
  return self;
};
module.exports = DocString;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/ast/doc_string.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/ast/feature.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/ast";
    var __filename = "/cucumber/ast/feature.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/ast");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/ast");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/ast/feature.js"]._cached = module.exports;
    
    (function () {
        var Feature = function(keyword, name, description, line) {
  var Cucumber = require('../../cucumber');

  var scenarios = Cucumber.Type.Collection();
  var background;

  var self = {
    getKeyword: function getKeyword() {
      return keyword;
    },

    getName: function getName() {
      return name;
    },

    getDescription: function getDescription() {
      return description;
    },

    getLine: function getLine() {
      return line;
    },

    addBackground: function addBackground(newBackground) {
      background = newBackground;
    },

    getBackground: function getBackground() {
      return background;
    },

    hasBackground: function hasBackground() {
      return (typeof(background) != 'undefined');
    },

    addScenario: function addScenario(scenario) {
      scenarios.add(scenario);
    },

    getLastScenario: function getLastScenario() {
      return scenarios.getLast();
    },

    acceptVisitor: function acceptVisitor(visitor, callback) {
      self.instructVisitorToVisitBackground(visitor, function() {
        self.instructVisitorToVisitScenarios(visitor, callback);
      });
    },

    instructVisitorToVisitBackground: function instructVisitorToVisitBackground(visitor, callback) {
      if (self.hasBackground()) {
        var background = self.getBackground();
        visitor.visitBackground(background, callback);
      } else {
        callback();
      }
    },

    instructVisitorToVisitScenarios: function instructVisitorToVisitScenarios(visitor, callback) {
      scenarios.forEach(function(scenario, iterate) {
        visitor.visitScenario(scenario, iterate);
      }, callback);
    }
  };
  return self;
};
module.exports = Feature;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/ast/feature.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/ast/features.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/ast";
    var __filename = "/cucumber/ast/features.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/ast");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/ast");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/ast/features.js"]._cached = module.exports;
    
    (function () {
        var Features = function() {
  var Cucumber = require('../../cucumber');

  var features = Cucumber.Type.Collection();

  var self = {
    addFeature: function addFeature(feature) {
      features.add(feature);
    },

    getLastFeature: function getLastFeature() {
      return features.getLast();
    },

    acceptVisitor: function acceptVisitor(visitor, callback) {
      features.forEach(function(feature, iterate) {
        visitor.visitFeature(feature, iterate);
      }, callback);
    }
  };
  return self;
};
module.exports = Features;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/ast/features.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/ast/scenario.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/ast";
    var __filename = "/cucumber/ast/scenario.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/ast");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/ast");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/ast/scenario.js"]._cached = module.exports;
    
    (function () {
        var Scenario = function(keyword, name, description, line, background) {
  var Cucumber = require('../../cucumber');

  var steps = Cucumber.Type.Collection();

  var self = {
    getKeyword: function getKeyword() {
      return keyword;
    },

    getName: function getName() {
      return name;
    },

    getDescription: function getDescription() {
      return description;
    },

    getLine: function getLine() {
      return line;
    },

    addStep: function addStep(step) {
      steps.add(step);
    },

    getLastStep: function getLastStep() {
      return steps.getLast();
    },

    acceptVisitor: function acceptVisitor(visitor, callback) {
      self.instructVisitorToVisitBackgroundSteps(visitor, function() {
        self.instructVisitorToVisitScenarioSteps(visitor, callback);
      });
    },

    instructVisitorToVisitBackgroundSteps: function instructVisitorToVisitBackgroundSteps(visitor, callback) {
      if (typeof(background) != 'undefined') {
        var steps = background.getSteps();
        self.instructVisitorToVisitSteps(visitor, steps, callback);
      } else {
        callback();
      }
    },

    instructVisitorToVisitScenarioSteps: function instructVisitorToVisitScenarioSteps(visitor, callback) {
      self.instructVisitorToVisitSteps(visitor, steps, callback);
    },

    instructVisitorToVisitSteps: function instructVisitorToVisitSteps(visitor, steps, callback) {
      steps.forEach(function(step, iterate) {
        visitor.visitStep(step, iterate);
      }, callback);
    }
  };
  return self;
};
module.exports = Scenario;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/ast/scenario.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/ast/step.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/ast";
    var __filename = "/cucumber/ast/step.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/ast");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/ast");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/ast/step.js"]._cached = module.exports;
    
    (function () {
        var Step = function(keyword, name, line, previousStep) {
  var Cucumber = require('../../cucumber');
  var docString, dataTable;

  var self = {
    getKeyword: function getKeyword() {
      return keyword;
    },

    getName: function getName() {
      return name;
    },

    getLine: function getLine() {
      return line;
    },

    getAttachment: function getAttachment() {
      var attachment;
      if (self.hasDocString()) {
        attachment = self.getDocString();
      } else if (self.hasDataTable()) {
        attachment = self.getDataTable();
      }
      return attachment;
    },

    getDocString: function getDocString() { return docString; },

    getDataTable: function getDataTable() { return dataTable; },

    hasDocString: function hasDocString() {
      return !!docString;
    },

    hasDataTable: function hasDataTable() {
      return !!dataTable;
    },

    attachDocString: function attachDocString(_docString) { docString = _docString; },

    attachDataTable: function attachDataTable(_dataTable) { dataTable = _dataTable; },

    attachDataTableRow: function attachDataTableRow(row) {
      self.ensureDataTableIsAttached();
      var dataTable = self.getDataTable();
      dataTable.attachRow(row);
    },

    ensureDataTableIsAttached: function ensureDataTableIsAttached() {
      var dataTable = self.getDataTable();
      if (!dataTable) {
        dataTable = Cucumber.Ast.DataTable();
        self.attachDataTable(dataTable);
      }
    },

    isOutcomeStep: function isOutcomeStep() {
      var isOutcomeStep =
        self.hasOutcomeStepKeyword() || self.isRepeatingOutcomeStep();
      return isOutcomeStep;
    },

    isEventStep: function isEventStep() {
      var isEventStep =
        self.hasEventStepKeyword() || self.isRepeatingEventStep();
      return isEventStep;
    },

    hasOutcomeStepKeyword: function hasOutcomeStepKeyword() {
      var hasOutcomeStepKeyword =
        keyword == Step.OUTCOME_STEP_KEYWORD;
      return hasOutcomeStepKeyword;
    },

    hasEventStepKeyword: function hasEventStepKeyword() {
      var hasEventStepKeyword =
        keyword == Step.EVENT_STEP_KEYWORD;
      return hasEventStepKeyword;
    },

    isRepeatingOutcomeStep: function isRepeatingOutcomeStep() {
      var isRepeatingOutcomeStep =
        self.hasRepeatStepKeyword() && self.isPrecededByOutcomeStep();
      return isRepeatingOutcomeStep;
    },

    isRepeatingEventStep: function isRepeatingEventStep() {
      var isRepeatingEventStep =
        self.hasRepeatStepKeyword() && self.isPrecededByEventStep();
      return isRepeatingEventStep;
    },

    hasRepeatStepKeyword: function hasRepeatStepKeyword() {
      var hasRepeatStepKeyword =
        keyword == Step.AND_STEP_KEYWORD || keyword == Step.BUT_STEP_KEYWORD;
      return hasRepeatStepKeyword;
    },

    isPrecededByOutcomeStep: function isPrecededByOutcomeStep() {
      var isPrecededByOutcomeStep =
        previousStep && previousStep.isOutcomeStep();
      return isPrecededByOutcomeStep;
    },

    isPrecededByEventStep: function isPrecededByEventStep() {
      var isPrecededByEventStep =
        previousStep && previousStep.isEventStep();
      return isPrecededByEventStep;
    },

    acceptVisitor: function acceptVisitor(visitor, callback) {
      self.execute(visitor, function(stepResult) {
        visitor.visitStepResult(stepResult, callback);
      });
    },

    execute: function execute(visitor, callback) {
      var stepDefinition = visitor.lookupStepDefinitionByName(name);
      var world          = visitor.getWorld();
      var attachment     = self.getAttachment();
      stepDefinition.invoke(name, world, attachment, callback);
    }
  };
  return self;
};
Step.EVENT_STEP_KEYWORD   = 'When ';
Step.OUTCOME_STEP_KEYWORD = 'Then ';
Step.AND_STEP_KEYWORD     = 'And ';
Step.BUT_STEP_KEYWORD     = 'But ';
module.exports = Step;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/ast/step.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/debug.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber";
    var __filename = "/cucumber/debug.js";
    
    var require = function (file) {
        return __require(file, "/cucumber");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/debug.js"]._cached = module.exports;
    
    (function () {
        var Debug = {
  TODO: function TODO(description) {
    return function() { throw(new Error("IMPLEMENT ME: " + description)); };
  },

  warn: function warn(string, caption, level) {
    if (Debug.isMessageLeveltoBeDisplayed(level))
      process.stdout.write(Debug.warningString(string, caption));
  },

  notice: function notice(string, caption, level) {
    if (Debug.isMessageLeveltoBeDisplayed(level))
      process.stdout.write(Debug.noticeString(string, caption));
  },

  warningString: function warningString(string, caption) {
    caption = caption || 'debug-warning';
    return "\033[30;43m" + caption + ":\033[0m \033[33m" + string + "\033[0m"
  },

  noticeString: function noticeString(string, caption) {
    caption = caption || 'debug-notice';
    return "\033[30;46m" + caption + ":\033[0m \033[36m" + string + "\033[0m"
  },

  prefix: function prefix() {
    return ;
  },

  isMessageLeveltoBeDisplayed: function isMessageLeveltoBeDisplayed(level) {
    if (process.env) {
      level = level || 3; // default level
      return (level <= process.env['DEBUG_LEVEL']);
    } else {
      return false;
    }
  }
};
Debug.SimpleAstListener = require('./debug/simple_ast_listener');
module.exports          = Debug;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/debug.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/debug/simple_ast_listener.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/debug";
    var __filename = "/cucumber/debug/simple_ast_listener.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/debug");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/debug");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/debug/simple_ast_listener.js"]._cached = module.exports;
    
    (function () {
        var SimpleAstListener = function(options) {
  var logs                        = '';
  var failed                      = false;
  var beforeEachScenarioCallbacks = [];
  var currentStep;

  if (!options)
    var options = {};

  var self = {
    hear: function hear(event, callback) {
      switch(event.getName()) {
      case 'BeforeFeature':
        self.hearBeforeFeature(event.getPayloadItem('feature'), callback);
        break;
      case 'BeforeScenario':
        self.hearBeforeScenario(event.getPayloadItem('scenario'), callback);
        break;
      case 'BeforeStep':
        self.hearBeforeStep(event.getPayloadItem('step'), callback);
        break;
      case 'StepResult':
        self.hearStepResult(event.getPayloadItem('stepResult'), callback);
        break;
      default:
        callback();
      }
    },

    hearBeforeFeature: function hearBeforeFeature(feature, callback) {
      log("Feature: " + feature.getName());
      var description = feature.getDescription();
      if (description != "")
        log(description, 1);
      callback();
    },

    hearBeforeScenario: function hearBeforeScenario(scenario, callback) {
      beforeEachScenarioCallbacks.forEach(function(func) {
        func();
      });
      log("");
      log(scenario.getKeyword() + ": " + scenario.getName(), 1);
      callback();
    },

    hearBeforeStep: function hearBeforeStep(step, callback) {
      currentStep = step;
      callback();
    },

    hearStepResult: function hearStepResult(stepResult, callback) {
      log(currentStep.getKeyword() + currentStep.getName(), 2);
      if (currentStep.hasDocString()) {
        log('"""', 3);
        log(currentStep.getDocString().getContents(), 3);
        log('"""', 3);
      };
      callback();
    },

    getLogs: function getLogs() {
      return logs;
    },

    featuresPassed: function featuresPassed() {
      return !failed;
    },

    beforeEachScenarioDo: function beforeEachScenarioDo(func) {
      beforeEachScenarioCallbacks.push(func);
    }
  };
  return self;

  function log(message, indentation) {
    if (indentation)
      message = indent(message, indentation);
    logs = logs + message + "\n";
    if (options['logToConsole'])
      console.log(message);
    if (typeof(options['logToFunction']) == 'function')
      options['logToFunction'](message);
  };

  function indent(text, indentation) {
    var indented;
    text.split("\n").forEach(function(line) {
      var prefix = new Array(indentation + 1).join("  ");
      line = prefix + line;
      indented = (typeof(indented) == 'undefined' ? line : indented + "\n" + line);
    });
    return indented;
  };
};
module.exports = SimpleAstListener;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/debug/simple_ast_listener.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/listener.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber";
    var __filename = "/cucumber/listener.js";
    
    var require = function (file) {
        return __require(file, "/cucumber");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/listener.js"]._cached = module.exports;
    
    (function () {
        var Listener               = {};
Listener.ProgressFormatter = require('./listener/progress_formatter');
module.exports             = Listener;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/listener.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/listener/progress_formatter.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/listener";
    var __filename = "/cucumber/listener/progress_formatter.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/listener");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/listener");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/listener/progress_formatter.js"]._cached = module.exports;
    
    (function () {
        var ProgressFormatter = function(options) {
  var Cucumber = require('../../cucumber');

  var logs                     = "";
  var failedScenarioLogBuffer  = "";
  var undefinedStepLogBuffer   = "";
  var passedScenarioCount      = 0;
  var undefinedScenarioCount   = 0;
  var pendingScenarioCount     = 0;
  var failedScenarioCount      = 0;
  var passedStepCount          = 0;
  var failedStepCount          = 0;
  var skippedStepCount         = 0;
  var undefinedStepCount       = 0;
  var pendingStepCount         = 0;
  var currentScenarioFailing   = false;
  var currentScenarioUndefined = false;
  var currentScenarioPending   = false;
  var failedStepResults        = Cucumber.Type.Collection();

  if (!options)
    options = {};
  if (options['logToConsole'] == undefined)
    options['logToConsole'] = true;
  var self = {
    log: function log(string) {
      logs += string;
      if (options['logToConsole'])
        process.stdout.write(string);
      if (typeof(options['logToFunction']) == 'function')
        options['logToFunction'](string);
    },

    getLogs: function getLogs() {
      return logs;
    },

    hear: function hear(event, callback) {
      if (self.hasHandlerForEvent(event)) {
        var handler = self.getHandlerForEvent(event);
        handler(event, callback);
      } else {
        callback();
      }
    },

    hasHandlerForEvent: function hasHandlerForEvent(event) {
      var handlerName = self.buildHandlerNameForEvent(event);
      return self[handlerName] != undefined;
    },

    buildHandlerNameForEvent: function buildHandlerNameForEvent(event) {
      var handlerName =
        ProgressFormatter.EVENT_HANDLER_NAME_PREFIX +
        event.getName() +
        ProgressFormatter.EVENT_HANDLER_NAME_SUFFIX;
      return handlerName;
    },

    getHandlerForEvent: function getHandlerForEvent(event) {
      var eventHandlerName = self.buildHandlerNameForEvent(event);
      return self[eventHandlerName];
    },

    handleBeforeScenarioEvent: function handleBeforeScenarioEvent(event, callback) {
      self.prepareBeforeScenario();
      callback();
    },

    handleStepResultEvent: function handleStepResultEvent(event, callback) {
      var stepResult = event.getPayloadItem('stepResult');
      if (stepResult.isSuccessful()) {
        self.witnessPassedStep();
        self.log(ProgressFormatter.PASSED_STEP_CHARACTER);
      } else if (stepResult.isPending()) {
        self.witnessPendingStep();
        self.markCurrentScenarioAsPending();
        self.log(ProgressFormatter.PENDING_STEP_CHARACTER);
      } else {
        self.storeFailedStepResult(stepResult);
        self.witnessFailedStep();
        self.markCurrentScenarioAsFailing();
        self.log(ProgressFormatter.FAILED_STEP_CHARACTER);
      }
      callback();
    },

    handleUndefinedStepEvent: function handleUndefinedStepEvent(event, callback) {
      var step = event.getPayloadItem('step');
      self.storeUndefinedStep(step);
      self.witnessUndefinedStep();
      self.markCurrentScenarioAsUndefined();
      self.log(ProgressFormatter.UNDEFINED_STEP_CHARACTER);
      callback();
    },

    handleSkippedStepEvent: function(event, callback) {
      self.witnessSkippedStep();
      self.log(ProgressFormatter.SKIPPED_STEP_CHARACTER);
      callback();
    },

    handleAfterFeaturesEvent: function handleAfterFeaturesEvent(event, callback) {
      self.logSummary();
      callback();
    },

    handleAfterScenarioEvent: function handleAfterScenarioEvent(event, callback) {
      if (self.isCurrentScenarioFailing()) {
        var scenario = event.getPayloadItem('scenario');
        self.storeFailedScenario(scenario);
        self.witnessFailedScenario();
      } else if (self.isCurrentScenarioUndefined()) {
        self.witnessUndefinedScenario();
      } else if (self.isCurrentScenarioPending()) {
        self.witnessPendingScenario();
      } else {
        self.witnessPassedScenario();
      }
      callback();
    },

    prepareBeforeScenario: function prepareBeforeScenario() {
      currentScenarioFailing   = false;
      currentScenarioPending   = false;
      currentScenarioUndefined = false;
    },

    markCurrentScenarioAsFailing: function markCurrentScenarioAsFailing() {
      currentScenarioFailing = true;
    },

    markCurrentScenarioAsUndefined: function markCurrentScenarioAsUndefined() {
      currentScenarioUndefined = true;
    },

    markCurrentScenarioAsPending: function markCurrentScenarioAsPending() {
      currentScenarioPending = true;
    },

    isCurrentScenarioFailing: function isCurrentScenarioFailing() {
      return currentScenarioFailing;
    },

    isCurrentScenarioUndefined: function isCurrentScenarioUndefined() {
      return currentScenarioUndefined;
    },

    isCurrentScenarioPending: function isCurrentScenarioPending() {
      return currentScenarioPending;
    },

    storeFailedStepResult: function storeFailedStepResult(failedStepResult) {
      failedStepResults.add(failedStepResult);
    },

    storeFailedScenario: function storeFailedScenario(failedScenario) {
      var name = failedScenario.getName();
      var line = failedScenario.getLine();
      self.appendStringToFailedScenarioLogBuffer(":" + line + " # Scenario: " + name);
    },

    storeUndefinedStep: function storeUndefinedStep(step) {
      var snippetBuilder = Cucumber.SupportCode.StepDefinitionSnippetBuilder(step);
      var snippet        = snippetBuilder.buildSnippet();
      self.appendStringToUndefinedStepLogBuffer(snippet);
    },

    appendStringToFailedScenarioLogBuffer: function appendStringToFailedScenarioLogBuffer(string) {
      failedScenarioLogBuffer += string + "\n";
    },

    appendStringToUndefinedStepLogBuffer: function appendStringToUndefinedStepLogBuffer(string) {
      if (undefinedStepLogBuffer.indexOf(string) == -1)
        undefinedStepLogBuffer += string + "\n";
    },

    getFailedScenarioLogBuffer: function getFailedScenarioLogBuffer() {
      return failedScenarioLogBuffer;
    },

    getUndefinedStepLogBuffer: function getUndefinedStepLogBuffer() {
      return undefinedStepLogBuffer;
    },

    logSummary: function logSummary() {
      self.log("\n\n");
      if (self.witnessedAnyFailedStep())
        self.logFailedStepResults();
      self.logScenariosSummary();
      self.logStepsSummary();
      if (self.witnessedAnyUndefinedStep())
        self.logUndefinedStepSnippets();
    },

    logFailedStepResults: function logFailedStepResults() {
      self.log("(::) failed steps (::)\n\n");
      failedStepResults.syncForEach(function(stepResult) {
        self.logFailedStepResult(stepResult);
      });
      self.log("Failing scenarios:\n");
      var failedScenarios = self.getFailedScenarioLogBuffer();
      self.log(failedScenarios);
      self.log("\n");
    },

    logFailedStepResult: function logFailedStepResult(stepResult) {
      var failureMessage = stepResult.getFailureException();
      self.log(failureMessage.stack || failureMessage);
      self.log("\n\n");
    },

    logScenariosSummary: function logScenariosSummary() {
      var scenarioCount          = self.getScenarioCount();
      var passedScenarioCount    = self.getPassedScenarioCount();
      var undefinedScenarioCount = self.getUndefinedScenarioCount();
      var pendingScenarioCount   = self.getPendingScenarioCount();
      var failedScenarioCount    = self.getFailedScenarioCount();
      var details                = [];

      self.log(scenarioCount + " scenario" + (scenarioCount != 1 ? "s" : ""));
      if (scenarioCount > 0 ) {
        if (failedScenarioCount > 0)
          details.push(failedScenarioCount + " failed");
        if (undefinedScenarioCount > 0)
          details.push(undefinedScenarioCount + " undefined");
        if (pendingScenarioCount > 0)
          details.push(pendingScenarioCount + " pending");
        if (passedScenarioCount > 0)
          details.push(passedScenarioCount + " passed");
        self.log(" (" + details.join(', ') + ")");
      }
      self.log("\n");
    },

    logStepsSummary: function logStepsSummary() {
      var stepCount          = self.getStepCount();
      var passedStepCount    = self.getPassedStepCount();
      var undefinedStepCount = self.getUndefinedStepCount();
      var skippedStepCount   = self.getSkippedStepCount();
      var pendingStepCount   = self.getPendingStepCount();
      var failedStepCount    = self.getFailedStepCount();
      var details            = [];

      self.log(stepCount + " step" + (stepCount != 1 ? "s" : ""));
      if (stepCount > 0) {
        if (failedStepCount > 0)
          details.push(failedStepCount    + " failed");
        if (undefinedStepCount > 0)
          details.push(undefinedStepCount + " undefined");
        if (pendingStepCount > 0)
          details.push(pendingStepCount   + " pending");
        if (skippedStepCount > 0)
          details.push(skippedStepCount   + " skipped");
        if (passedStepCount > 0)
          details.push(passedStepCount    + " passed");
        self.log(" (" + details.join(', ') + ")");
      }
      self.log("\n");
    },

    logUndefinedStepSnippets: function logUndefinedStepSnippets() {
      var undefinedStepLogBuffer = self.getUndefinedStepLogBuffer();
      self.log("\nYou can implement step definitions for undefined steps with these snippets:\n\n");
      self.log(undefinedStepLogBuffer);
    },

    witnessPassedScenario: function witnessPassedScenario() {
      passedScenarioCount++;
    },

    witnessUndefinedScenario: function witnessUndefinedScenario() {
      undefinedScenarioCount++;
    },

    witnessPendingScenario: function witnessPendingScenario() {
      pendingScenarioCount++;
    },

    witnessFailedScenario: function witnessFailedScenario() {
      failedScenarioCount++;
    },

    witnessPassedStep: function witnessPassedStep() {
      passedStepCount++;
    },

    witnessUndefinedStep: function witnessUndefinedStep() {
      undefinedStepCount++;
    },

    witnessPendingStep: function witnessPendingStep() {
      pendingStepCount++;
    },

    witnessFailedStep: function witnessFailedStep() {
      failedStepCount++;
    },

    witnessSkippedStep: function witnessSkippedStep() {
      skippedStepCount++;
    },

    getScenarioCount: function getScenarioCount() {
      var scenarioCount =
        self.getPassedScenarioCount()    +
        self.getUndefinedScenarioCount() +
        self.getPendingScenarioCount()   +
        self.getFailedScenarioCount();
      return scenarioCount;
    },

    getPassedScenarioCount: function getPassedScenarioCount() {
      return passedScenarioCount;
    },

    getUndefinedScenarioCount: function getUndefinedScenarioCount() {
      return undefinedScenarioCount;
    },

    getPendingScenarioCount: function getPendingScenarioCount() {
      return pendingScenarioCount;
    },

    getFailedScenarioCount: function getFailedScenarioCount() {
      return failedScenarioCount;
    },

    getStepCount: function getStepCount() {
      var stepCount =
        self.getPassedStepCount()    +
        self.getUndefinedStepCount() +
        self.getSkippedStepCount()   +
        self.getPendingStepCount()   +
        self.getFailedStepCount();
      return stepCount;
    },

    getPassedStepCount: function getPassedStepCount() {
      return passedStepCount;
    },

    getPendingStepCount: function getPendingStepCount() {
      return pendingStepCount;
    },

    getFailedStepCount: function getFailedStepCount() {
      return failedStepCount;
    },

    getSkippedStepCount: function getSkippedStepCount() {
      return skippedStepCount;
    },

    getUndefinedStepCount: function getUndefinedStepCount() {
      return undefinedStepCount;
    },

    witnessedAnyFailedStep: function witnessedAnyFailedStep() {
      return failedStepCount > 0;
    },

    witnessedAnyUndefinedStep: function witnessedAnyUndefinedStep() {
      return undefinedStepCount > 0;
    }
  };
  return self;
};
ProgressFormatter.PASSED_STEP_CHARACTER     = '.';
ProgressFormatter.SKIPPED_STEP_CHARACTER    = '-';
ProgressFormatter.UNDEFINED_STEP_CHARACTER  = 'U';
ProgressFormatter.PENDING_STEP_CHARACTER    = 'P';
ProgressFormatter.FAILED_STEP_CHARACTER     = 'F';
ProgressFormatter.EVENT_HANDLER_NAME_PREFIX = 'handle';
ProgressFormatter.EVENT_HANDLER_NAME_SUFFIX = 'Event';
module.exports                              = ProgressFormatter;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/listener/progress_formatter.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/parser.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber";
    var __filename = "/cucumber/parser.js";
    
    var require = function (file) {
        return __require(file, "/cucumber");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/parser.js"]._cached = module.exports;
    
    (function () {
        var Parser = function(featureSources) {
  var Gherkin  = require('gherkin');
  var Cucumber = require('../cucumber');

  var features = Cucumber.Ast.Features();

  var self = {
    parse: function parse() {
      var Lexer = Gherkin.Lexer('en');
      var lexer = new Lexer(self.getEventHandlers());
      for (i in featureSources) {
        var featureSource = featureSources[i][Parser.FEATURE_NAME_SOURCE_PAIR_SOURCE_INDEX];
        lexer.scan(featureSource);
      }
      return features;
    },

    getEventHandlers: function getEventHandlers() {
      return {
        background: self.handleBackground,
        comment:    self.handleComment,
        doc_string: self.handleDocString,
        eof:        self.handleEof,
        feature:    self.handleFeature,
        row:        self.handleRow,
        scenario:   self.handleScenario,
        step:       self.handleStep
      };
    },

    getCurrentFeature: function getCurrentFeature() {
      return features.getLastFeature();
    },

    getCurrentScenarioOrBackground: function getCurrentScenarioOrBackground() {
      var currentFeature       = self.getCurrentFeature();
      var scenarioOrBackground = currentFeature.getLastScenario();
      if (!scenarioOrBackground)
        scenarioOrBackground = currentFeature.getBackground();
      return scenarioOrBackground;
    },

    getCurrentStep: function getCurrentStep() {
      var currentScenarioOrBackground = self.getCurrentScenarioOrBackground();
      return currentScenarioOrBackground.getLastStep();
    },

    handleBackground: function handleBackground(keyword, name, description, line) {
      var background     = Cucumber.Ast.Background(keyword, name, description, line);
      var currentFeature = self.getCurrentFeature();
      currentFeature.addBackground(background);
    },

    handleComment: function handleComment() {},

    handleDocString: function handleDocString(contentType, string, line) {
      var docString   = Cucumber.Ast.DocString(contentType, string, line);
      var currentStep = self.getCurrentStep();
      currentStep.attachDocString(docString);
    },

    handleEof: function handleEof() {},

    handleFeature: function handleFeature(keyword, name, description, line) {
      var feature = Cucumber.Ast.Feature(keyword, name, description, line);
      features.addFeature(feature);
    },

    handleRow: function handleRow(cells, line) {
      var currentStep = self.getCurrentStep();
      var row         = Cucumber.Ast.DataTable.Row(cells, line);
      currentStep.attachDataTableRow(row);
    },

    handleScenario: function handleScenario(keyword, name, description, line) {
      var currentFeature = self.getCurrentFeature();
      var background     = currentFeature.getBackground();
      var scenario       = Cucumber.Ast.Scenario(keyword, name, description, line, background);
      currentFeature.addScenario(scenario);
    },

    handleStep: function handleStep(keyword, name, line) {
      var currentScenarioOrBackground = self.getCurrentScenarioOrBackground();
      var previousStep                = self.getCurrentStep();
      var step                        = Cucumber.Ast.Step(keyword, name, line, previousStep);
      currentScenarioOrBackground.addStep(step);
    }
  };
  return self;
};
Parser.FEATURE_NAME_SOURCE_PAIR_SOURCE_INDEX = 1;
module.exports = Parser;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/parser.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/gherkin/package.json"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/gherkin";
    var __filename = "/node_modules/gherkin/package.json";
    
    var require = function (file) {
        return __require(file, "/node_modules/gherkin");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/gherkin");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/gherkin/package.json"]._cached = module.exports;
    
    (function () {
        module.exports = {"name":"gherkin","description":"A fast Gherkin lexer/parser based on the Ragel State Machine Compiler.","keywords":["testing","bdd","cucumber","gherkin","tests"],"version":"2.5.1","homepage":"http://github.com/cucumber/gherkin","author":"Aslak Hellesøy <aslak.hellesoy@gmail.com>","contributors":["Aslak Hellesøy <aslak.hellesoy@gmail.com>"],"repository":{"type":"git","url":"git://github.com/cucumber/gherkin.git"},"bugs":{"mail":"cukes@googlegroups.com","web":"http://github.com/cucumber/gherkin/issues"},"directories":{"lib":"./lib"},"main":"./lib/gherkin","engines":{"node":"0.4 || 0.5"},"licenses":[{"type":"MIT","url":"http://github.com/cucumber/gherkin/raw/master/LICENSE"}]};
    }).call(module.exports);
    
    __require.modules["/node_modules/gherkin/package.json"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/gherkin/lib/gherkin.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/gherkin/lib";
    var __filename = "/node_modules/gherkin/lib/gherkin.js";
    
    var require = function (file) {
        return __require(file, "/node_modules/gherkin/lib");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/gherkin/lib");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/gherkin/lib/gherkin.js"]._cached = module.exports;
    
    (function () {
        exports.Lexer = function(lang) {
  return require('./gherkin/lexer/' + lang).Lexer;
};

exports.connect = function(path) {
  var gherkinFiles = require('connect').static(__dirname);

  return function(req, res, next) {
    if(req.url.indexOf(path) == 0) {
      req.url = req.url.slice(path.length);
      gherkinFiles(req, res, next);
    } else {
      next();
    }
  };
};;
    }).call(module.exports);
    
    __require.modules["/node_modules/gherkin/lib/gherkin.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/runtime.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber";
    var __filename = "/cucumber/runtime.js";
    
    var require = function (file) {
        return __require(file, "/cucumber");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/runtime.js"]._cached = module.exports;
    
    (function () {
        var Runtime = function(configuration) {
  var Cucumber = require('../cucumber');

  var listeners = Cucumber.Type.Collection();

  var self = {
    start: function start(callback) {
      if (typeof(callback) !== 'function')
        throw new Error(Runtime.START_MISSING_CALLBACK_ERROR);
      var features           = self.getFeatures();
      var supportCodeLibrary = self.getSupportCodeLibrary();
      var astTreeWalker      = Runtime.AstTreeWalker(features, supportCodeLibrary, listeners);
      astTreeWalker.walk(callback);
    },

    attachListener: function attachListener(listener) {
      listeners.add(listener);
    },

    getFeatures: function getFeatures() {
      var featureSources = configuration.getFeatureSources();
      var parser         = Cucumber.Parser(featureSources);
      var features       = parser.parse();
      return features;
    },

    getSupportCodeLibrary: function getSupportCodeLibrary() {
      var supportCodeLibrary = configuration.getSupportCodeLibrary();
      return supportCodeLibrary;
    }
  };
  return self;
};
Runtime.START_MISSING_CALLBACK_ERROR = "Cucumber.Runtime.start() expects a callback";
Runtime.AstTreeWalker        = require('./runtime/ast_tree_walker');
Runtime.PendingStepException = require('./runtime/pending_step_exception');
Runtime.SuccessfulStepResult = require('./runtime/successful_step_result');
Runtime.PendingStepResult    = require('./runtime/pending_step_result');
Runtime.FailedStepResult     = require('./runtime/failed_step_result');
module.exports               = Runtime;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/runtime.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/runtime/ast_tree_walker.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/runtime";
    var __filename = "/cucumber/runtime/ast_tree_walker.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/runtime");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/runtime");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/runtime/ast_tree_walker.js"]._cached = module.exports;
    
    (function () {
        var AstTreeWalker = function(features, supportCodeLibrary, listeners) {
  var listeners;
  var world;
  var allFeaturesSucceded = true;
  var skippingSteps       = false;

  var self = {
    walk: function walk(callback) {
      self.visitFeatures(features, function() {
        var featuresResult = self.didAllFeaturesSucceed();
        callback(featuresResult);
      });
    },

    visitFeatures: function visitFeatures(features, callback) {
      var event = AstTreeWalker.Event(AstTreeWalker.FEATURES_EVENT_NAME);
      self.broadcastEventAroundUserFunction(
        event,
        function(callback) { features.acceptVisitor(self, callback); },
        callback
      );
    },

    visitFeature: function visitFeature(feature, callback) {
      var payload = { feature: feature };
      var event   = AstTreeWalker.Event(AstTreeWalker.FEATURE_EVENT_NAME, payload);
      self.broadcastEventAroundUserFunction(
        event,
        function(callback) { feature.acceptVisitor(self, callback); },
        callback
      );
    },

    visitBackground: function visitBackground(background, callback) {
 	    var payload = { background: background };
 	    var event   = AstTreeWalker.Event(AstTreeWalker.BACKGROUND_EVENT_NAME, payload);
 	    self.broadcastEvent(event, callback);
 	  },

    visitScenario: function visitScenario(scenario, callback) {
      self.witnessNewScenario();
      var world = supportCodeLibrary.instantiateNewWorld();
      self.setWorld(world);

      var payload = { scenario: scenario };
      var event   = AstTreeWalker.Event(AstTreeWalker.SCENARIO_EVENT_NAME, payload);
      self.broadcastEventAroundUserFunction(
        event,
        function(callback) { scenario.acceptVisitor(self, callback); },
        callback
      );
    },

    visitStep: function visitStep(step, callback) {
      if (self.isStepUndefined(step)) {
        self.witnessUndefinedStep();
        self.skipUndefinedStep(step, callback);
      } else if (self.isSkippingSteps()) {
        self.skipStep(step, callback);
      } else {
        self.executeStep(step, callback);
      }
    },

    visitStepResult: function visitStepResult(stepResult, callback) {
      if (stepResult.isFailed())
        self.witnessFailedStep();
      else if (stepResult.isPending())
        self.witnessPendingStep();
      var payload = { stepResult: stepResult };
      var event   = AstTreeWalker.Event(AstTreeWalker.STEP_RESULT_EVENT_NAME, payload);
      self.broadcastEvent(event, callback);
    },

    broadcastEventAroundUserFunction: function broadcastEventAroundUserFunction(event, userFunction, callback) {
      var userFunctionWrapper = self.wrapUserFunctionAndAfterEventBroadcast(userFunction, event, callback);
      self.broadcastBeforeEvent(event, userFunctionWrapper);
    },

    wrapUserFunctionAndAfterEventBroadcast: function wrapUserFunctionAndAfterEventBroadcast(userFunction, event, callback) {
      var callAfterEventBroadcast = self.wrapAfterEventBroadcast(event, callback);
      return function callUserFunctionAndBroadcastAfterEvent() {
        userFunction(callAfterEventBroadcast);
      };
    },

    wrapAfterEventBroadcast: function wrapAfterEventBroadcast(event, callback) {
      return function() { self.broadcastAfterEvent(event, callback); };
    },

    broadcastBeforeEvent: function broadcastBeforeEvent(event, callback) {
      var preEvent = event.replicateAsPreEvent();
      self.broadcastEvent(preEvent, callback);
    },

    broadcastAfterEvent: function broadcastAfterEvent(event, callback) {
      var postEvent = event.replicateAsPostEvent();
      self.broadcastEvent(postEvent, callback);
    },

    broadcastEvent: function broadcastEvent(event, callback) {
      listeners.forEach(
        function(listener, callback) { listener.hear(event, callback); },
        callback
      );
    },

    lookupStepDefinitionByName: function lookupStepDefinitionByName(stepName) {
      return supportCodeLibrary.lookupStepDefinitionByName(stepName);
    },

    setWorld: function setWorld(newWorld) {
      world = newWorld;
    },

    getWorld: function getWorld() {
      return world;
    },

    isStepUndefined: function isStepUndefined(step) {
      var stepName = step.getName();
      return !supportCodeLibrary.isStepDefinitionNameDefined(stepName);
    },

    didAllFeaturesSucceed: function didAllFeaturesSucceed() {
      return allFeaturesSucceded;
    },

    witnessFailedStep: function witnessFailedStep() {
      allFeaturesSucceded = false;
      skippingSteps       = true;
    },

    witnessPendingStep: function witnessPendingStep() {
      skippingSteps = true;
    },

    witnessUndefinedStep: function witnessUndefinedStep() {
      skippingSteps = true;
    },

    witnessNewScenario: function witnessNewScenario() {
      skippingSteps = false;
    },

    isSkippingSteps: function isSkippingSteps() {
      return skippingSteps;
    },

    executeStep: function executeStep(step, callback) {
      var payload = { step: step };
      var event   = AstTreeWalker.Event(AstTreeWalker.STEP_EVENT_NAME, payload);
      self.broadcastEventAroundUserFunction(
        event,
        function(callback) { step.acceptVisitor(self, callback); },
        callback
      );
    },

    skipStep: function skipStep(step, callback) {
      var payload = { step: step };
      var event   = AstTreeWalker.Event(AstTreeWalker.SKIPPED_STEP_EVENT_NAME, payload);
      self.broadcastEvent(event, callback);
    },

    skipUndefinedStep: function skipUndefinedStep(step, callback) {
      var payload = { step: step };
      var event   = AstTreeWalker.Event(AstTreeWalker.UNDEFINED_STEP_EVENT_NAME, payload);
      self.broadcastEvent(event, callback);
    }
  };
  return self;
};
AstTreeWalker.FEATURES_EVENT_NAME                 = 'Features';
AstTreeWalker.FEATURE_EVENT_NAME                  = 'Feature';
AstTreeWalker.BACKGROUND_EVENT_NAME               = 'Background';
AstTreeWalker.SCENARIO_EVENT_NAME                 = 'Scenario';
AstTreeWalker.STEP_EVENT_NAME                     = 'Step';
AstTreeWalker.UNDEFINED_STEP_EVENT_NAME           = 'UndefinedStep';
AstTreeWalker.SKIPPED_STEP_EVENT_NAME             = 'SkippedStep';
AstTreeWalker.STEP_RESULT_EVENT_NAME              = 'StepResult';
AstTreeWalker.BEFORE_EVENT_NAME_PREFIX            = 'Before';
AstTreeWalker.AFTER_EVENT_NAME_PREFIX             = 'After';
AstTreeWalker.NON_EVENT_LEADING_PARAMETERS_COUNT  = 0;
AstTreeWalker.NON_EVENT_TRAILING_PARAMETERS_COUNT = 2;
AstTreeWalker.Event                               = require('./ast_tree_walker/event');
module.exports                                    = AstTreeWalker;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/runtime/ast_tree_walker.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/runtime/ast_tree_walker/event.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/runtime/ast_tree_walker";
    var __filename = "/cucumber/runtime/ast_tree_walker/event.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/runtime/ast_tree_walker");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/runtime/ast_tree_walker");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/runtime/ast_tree_walker/event.js"]._cached = module.exports;
    
    (function () {
        var Event = function(name, payload) {
  var AstTreeWalker = require('../ast_tree_walker');

  var self = {
    getName: function getName() {
      return name;
    },

    getPayloadItem: function getPayloadItem(itemName) {
      return payload[itemName];
    },

    replicateAsPreEvent: function replicateAsPreEvent() {
      var newName = buildBeforeEventName(name);
      return AstTreeWalker.Event(newName, payload);
    },

    replicateAsPostEvent: function replicateAsPostEvent() {
      var newName = buildAfterEventName(name);
      return AstTreeWalker.Event(newName, payload);
    },

    occurredOn: function occurredOn(eventName) {
      return eventName == name;
    },

    occurredAfter: function occurredAfter(eventName) {
      var afterEventName = buildAfterEventName(eventName);
      return afterEventName == name;
    }
  };

  function buildBeforeEventName(eventName) {
    return AstTreeWalker.BEFORE_EVENT_NAME_PREFIX + eventName;
  }

  function buildAfterEventName(eventName) {
    return AstTreeWalker.AFTER_EVENT_NAME_PREFIX + eventName;
  }

  return self;
};
module.exports = Event;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/runtime/ast_tree_walker/event.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/runtime/pending_step_exception.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/runtime";
    var __filename = "/cucumber/runtime/pending_step_exception.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/runtime");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/runtime");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/runtime/pending_step_exception.js"]._cached = module.exports;
    
    (function () {
        var PendingStepException = function PendingStepException(reason) {
  if (!(this instanceof PendingStepException))
    return new PendingStepException(reason);
};
module.exports = PendingStepException;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/runtime/pending_step_exception.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/runtime/successful_step_result.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/runtime";
    var __filename = "/cucumber/runtime/successful_step_result.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/runtime");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/runtime");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/runtime/successful_step_result.js"]._cached = module.exports;
    
    (function () {
        var SuccessfulStepResult = function() {
  var self = {
    isSuccessful: function isSuccessful() { return true; },
    isPending:    function isPending()    { return false; },
    isFailed:     function isFailed()     { return false; }
  };
  return self;
};
module.exports = SuccessfulStepResult;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/runtime/successful_step_result.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/runtime/pending_step_result.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/runtime";
    var __filename = "/cucumber/runtime/pending_step_result.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/runtime");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/runtime");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/runtime/pending_step_result.js"]._cached = module.exports;
    
    (function () {
        var PendingStepResult = function() {
  var self = {
    isSuccessful: function isSuccessful() { return false; },
    isPending:    function isPending()    { return true; },
    isFailed:     function isFailed()     { return false; }
  };
  return self;
};
module.exports = PendingStepResult;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/runtime/pending_step_result.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/runtime/failed_step_result.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/runtime";
    var __filename = "/cucumber/runtime/failed_step_result.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/runtime");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/runtime");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/runtime/failed_step_result.js"]._cached = module.exports;
    
    (function () {
        var FailedStepResult = function(failureException) {
  var self = {
    isSuccessful: function isSuccessful() { return false; },
    isPending:    function isPending()    { return false; },
    isFailed:     function isFailed()     { return true; },

    getFailureException: function getFailureException() {
      return failureException;
    }
  };
  return self;
};
module.exports = FailedStepResult;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/runtime/failed_step_result.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/support_code.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber";
    var __filename = "/cucumber/support_code.js";
    
    var require = function (file) {
        return __require(file, "/cucumber");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/support_code.js"]._cached = module.exports;
    
    (function () {
        var SupportCode                          = {};
SupportCode.Library                      = require('./support_code/library');
SupportCode.StepDefinition               = require('./support_code/step_definition');
SupportCode.StepDefinitionSnippetBuilder = require('./support_code/step_definition_snippet_builder');
SupportCode.WorldConstructor             = require('./support_code/world_constructor');
module.exports                           = SupportCode;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/support_code.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/support_code/library.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/support_code";
    var __filename = "/cucumber/support_code/library.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/support_code");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/support_code");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/support_code/library.js"]._cached = module.exports;
    
    (function () {
        var Library = function(supportCodeDefinition) {
  var Cucumber = require('../../cucumber');

  var stepDefinitions = Cucumber.Type.Collection();
  var worldConstructor = Cucumber.SupportCode.WorldConstructor();

  var self = {
    lookupStepDefinitionByName: function lookupStepDefinitionByName(name) {
      var matchingStepDefinition;

      stepDefinitions.syncForEach(function(stepDefinition) {
        if (stepDefinition.matchesStepName(name)) {
          matchingStepDefinition = stepDefinition;
        }
      });
      return matchingStepDefinition;
    },

    isStepDefinitionNameDefined: function isStepDefinitionNameDefined(name) {
      var stepDefinition = self.lookupStepDefinitionByName(name);
      return (stepDefinition != undefined);
    },

    defineStep: function defineStep(name, code) {
      var stepDefinition = Cucumber.SupportCode.StepDefinition(name, code);
      stepDefinitions.add(stepDefinition);
    },

    instantiateNewWorld: function instantiateNewWorld() {
      return new worldConstructor();
    }
  };

  var supportCodeHelper = {
    Given      : self.defineStep,
    When       : self.defineStep,
    Then       : self.defineStep,
    defineStep : self.defineStep,
    World      : worldConstructor
  };
  supportCodeDefinition.call(supportCodeHelper);
  worldConstructor = supportCodeHelper.World;

  return self;
};
module.exports = Library;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/support_code/library.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/support_code/step_definition.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/support_code";
    var __filename = "/cucumber/support_code/step_definition.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/support_code");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/support_code");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/support_code/step_definition.js"]._cached = module.exports;
    
    (function () {
        var StepDefinition = function(regexp, code) {
  var Cucumber = require('../../cucumber');

  var self = {
    matchesStepName: function matchesStepName(stepName) {
      return regexp.test(stepName);
    },

    invoke: function invoke(stepName, world, stepAttachment, callback) {
      var codeCallback = function() {
        var successfulStepResult = Cucumber.Runtime.SuccessfulStepResult();
        callback(successfulStepResult);
      };
      codeCallback.pending = function pending(reason) {
        throw Cucumber.Runtime.PendingStepException(reason);
      };

      var parameters = self.buildInvocationParameters(stepName, stepAttachment, codeCallback);
      try {
        code.apply(world, parameters);
      } catch (exception) {
        if (exception)
          Cucumber.Debug.warn(exception.stack || exception, 'exception inside feature', 3);
        var stepResult;
        if (exception instanceof Cucumber.Runtime.PendingStepException)
          stepResult = Cucumber.Runtime.PendingStepResult()
        else
          stepResult = Cucumber.Runtime.FailedStepResult(exception);
        callback(stepResult);
      }
    },

    buildInvocationParameters: function buildInvocationParameters(stepName, stepAttachment, callback) {
      var parameters = regexp.exec(stepName);
      parameters.shift();
      if (stepAttachment) {
        var contents = stepAttachment.getContents();
        parameters.push(contents);
      }
      parameters.push(callback);
      return parameters;
    }
  };
  return self;
};
module.exports = StepDefinition;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/support_code/step_definition.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/support_code/step_definition_snippet_builder.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/support_code";
    var __filename = "/cucumber/support_code/step_definition_snippet_builder.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/support_code");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/support_code");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/support_code/step_definition_snippet_builder.js"]._cached = module.exports;
    
    (function () {
        var _  = require('underscore');
var _s = require('underscore.string');

var StepDefinitionSnippetBuilder = function(step) {
  var Cucumber = require('../../cucumber');

  var self = {
    buildSnippet: function buildSnippet() {
      var functionName = self.buildStepDefinitionFunctionName();
      var pattern      = self.buildStepDefinitionPattern();
      var parameters   = self.buildStepDefinitionParameters();
      var snippet =
        StepDefinitionSnippetBuilder.STEP_DEFINITION_START  +
        functionName                                        +
        StepDefinitionSnippetBuilder.STEP_DEFINITION_INNER1 +
        pattern                                             +
        StepDefinitionSnippetBuilder.STEP_DEFINITION_INNER2 +
        parameters                                          +
        StepDefinitionSnippetBuilder.STEP_DEFINITION_END;
      return snippet;
    },

    buildStepDefinitionFunctionName: function buildStepDefinitionFunctionName() {
      var functionName;
      if (step.isOutcomeStep())
        functionName = StepDefinitionSnippetBuilder.OUTCOME_STEP_DEFINITION_FUNCTION_NAME;
      else if (step.isEventStep())
        functionName = StepDefinitionSnippetBuilder.EVENT_STEP_DEFINITION_FUNCTION_NAME;
      else
        functionName = StepDefinitionSnippetBuilder.CONTEXT_STEP_DEFINITION_FUNCTION_NAME;
      return functionName;
    },

    buildStepDefinitionPattern: function buildStepDefinitionPattern() {
      var stepName              = step.getName();
      var escapedStepName       = Cucumber.Util.RegExp.escapeString(stepName);
      var parameterizedStepName = self.parameterizeStepName(escapedStepName);
      var pattern               =
        StepDefinitionSnippetBuilder.PATTERN_START +
        parameterizedStepName                      +
        StepDefinitionSnippetBuilder.PATTERN_END
      return pattern;
    },

    buildStepDefinitionParameters: function buildStepDefinitionParameters() {
      var parameters = self.getStepDefinitionPatternMatchingGroupParameters();
      if (step.hasDocString())
        parameters = parameters.concat([StepDefinitionSnippetBuilder.STEP_DEFINITION_DOC_STRING]);
      else if (step.hasDataTable())
        parameters = parameters.concat([StepDefinitionSnippetBuilder.STEP_DEFINITION_DATA_TABLE]);
      var parametersAndCallback =
        parameters.concat([StepDefinitionSnippetBuilder.STEP_DEFINITION_CALLBACK]);
      var parameterString = parametersAndCallback.join(StepDefinitionSnippetBuilder.FUNCTION_PARAMETER_SEPARATOR);
      return parameterString;
    },

    getStepDefinitionPatternMatchingGroupParameters: function getStepDefinitionPatternMatchingGroupParameters() {
      var parameterCount = self.countStepDefinitionPatternMatchingGroups();
      var parameters = [];
      _(parameterCount).times(function(n) {
        var offset = n + 1;
        parameters.push('arg' + offset);
      });
      return parameters;
    },

    countStepDefinitionPatternMatchingGroups: function countStepDefinitionPatternMatchingGroups() {
      var stepDefinitionPattern    = self.buildStepDefinitionPattern();
      var numberMatchingGroupCount =
        _s.count(stepDefinitionPattern, StepDefinitionSnippetBuilder.NUMBER_MATCHING_GROUP);
      var quotedStringMatchingGroupCount =
        _s.count(stepDefinitionPattern, StepDefinitionSnippetBuilder.QUOTED_STRING_MATCHING_GROUP);
      var count = numberMatchingGroupCount + quotedStringMatchingGroupCount;
      return count;
    },

    parameterizeStepName: function parameterizeStepName(stepName) {
      var parameterizedStepName =
        stepName
        .replace(StepDefinitionSnippetBuilder.NUMBER_PATTERN, StepDefinitionSnippetBuilder.NUMBER_MATCHING_GROUP)
        .replace(StepDefinitionSnippetBuilder.QUOTED_STRING_PATTERN, StepDefinitionSnippetBuilder.QUOTED_STRING_MATCHING_GROUP);
      return parameterizedStepName;
    }
  };
  return self;
};

StepDefinitionSnippetBuilder.STEP_DEFINITION_START                 = 'this.';
StepDefinitionSnippetBuilder.STEP_DEFINITION_INNER1                = '(';
StepDefinitionSnippetBuilder.STEP_DEFINITION_INNER2                = ', function(';
StepDefinitionSnippetBuilder.STEP_DEFINITION_END                   = ") {\n  // express the regexp above with the code you wish you had\n  callback.pending();\n});\n";
StepDefinitionSnippetBuilder.STEP_DEFINITION_DOC_STRING            = 'string';
StepDefinitionSnippetBuilder.STEP_DEFINITION_DATA_TABLE            = 'table';
StepDefinitionSnippetBuilder.STEP_DEFINITION_CALLBACK              = 'callback';
StepDefinitionSnippetBuilder.PATTERN_START                         = '/^';
StepDefinitionSnippetBuilder.PATTERN_END                           = '$/';
StepDefinitionSnippetBuilder.CONTEXT_STEP_DEFINITION_FUNCTION_NAME = 'Given';
StepDefinitionSnippetBuilder.EVENT_STEP_DEFINITION_FUNCTION_NAME   = 'When';
StepDefinitionSnippetBuilder.OUTCOME_STEP_DEFINITION_FUNCTION_NAME = 'Then';
StepDefinitionSnippetBuilder.NUMBER_PATTERN                        = /\d+/i;
StepDefinitionSnippetBuilder.NUMBER_MATCHING_GROUP                 = '(\\d+)';
StepDefinitionSnippetBuilder.QUOTED_STRING_PATTERN                 = /"[^"]*"/i;
StepDefinitionSnippetBuilder.QUOTED_STRING_MATCHING_GROUP          = '"([^"]*)"';
StepDefinitionSnippetBuilder.FUNCTION_PARAMETER_SEPARATOR          = ', ';
module.exports = StepDefinitionSnippetBuilder;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/support_code/step_definition_snippet_builder.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/underscore/package.json"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/underscore";
    var __filename = "/node_modules/underscore/package.json";
    
    var require = function (file) {
        return __require(file, "/node_modules/underscore");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/underscore");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/underscore/package.json"]._cached = module.exports;
    
    (function () {
        module.exports = {"name":"underscore","description":"JavaScript's functional programming helper library.","homepage":"http://documentcloud.github.com/underscore/","keywords":["util","functional","server","client","browser"],"author":"Jeremy Ashkenas <jeremy@documentcloud.org>","contributors":[],"dependencies":[],"repository":{"type":"git","url":"git://github.com/documentcloud/underscore.git"},"main":"underscore.js","version":"1.1.7"};
    }).call(module.exports);
    
    __require.modules["/node_modules/underscore/package.json"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/underscore/underscore.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/underscore";
    var __filename = "/node_modules/underscore/underscore.js";
    
    var require = function (file) {
        return __require(file, "/node_modules/underscore");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/underscore");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/underscore/underscore.js"]._cached = module.exports;
    
    (function () {
        //     Underscore.js 1.1.7
//     (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **CommonJS**, with backwards-compatibility
  // for the old `require()` API. If we're not in CommonJS, add `_` to the
  // global object.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = _;
    _._ = _;
  } else {
    // Exported as a string, for Closure Compiler "advanced" mode.
    root['_'] = _;
  }

  // Current version.
  _.VERSION = '1.1.7';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = memo !== void 0;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError("Reduce of empty array with no initial value");
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return memo !== void 0 ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = (_.isArray(obj) ? obj.slice() : _.toArray(obj)).reverse();
    return _.reduce(reversed, iterator, memo, context);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator = iterator || _.identity;
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result |= iterator.call(context, value, index, list)) return breaker;
    });
    return !!result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    any(obj, function(value) {
      if (found = value === target) return true;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (method.call ? method || value : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.max.apply(Math, obj);
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.min.apply(Math, obj);
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Groups the object's values by a criterion produced by an iterator
  _.groupBy = function(obj, iterator) {
    var result = {};
    each(obj, function(value, index) {
      var key = iterator(value, index);
      (result[key] || (result[key] = [])).push(value);
    });
    return result;
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(iterable) {
    if (!iterable)                return [];
    if (iterable.toArray)         return iterable.toArray();
    if (_.isArray(iterable))      return slice.call(iterable);
    if (_.isArguments(iterable))  return slice.call(iterable);
    return _.values(iterable);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.toArray(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head`. The **guard** check allows it to work
  // with `_.map`.
  _.first = _.head = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Get the last element of an array.
  _.last = function(array) {
    return array[array.length - 1];
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(_.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted) {
    return _.reduce(array, function(memo, el, i) {
      if (0 == i || (isSorted === true ? _.last(memo) != el : !_.include(memo, el))) memo[memo.length] = el;
      return memo;
    }, []);
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays. (Aliased as "intersect" for back-compat.)
  _.intersection = _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and another.
  // Only the elements present in just the first array will remain.
  _.difference = function(array, other) {
    return _.filter(array, function(value){ return !_.include(other, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (array[i] === item) return i;
    return -1;
  };


  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function(func, obj) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(obj, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return hasOwnProperty.call(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(func, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Internal function used to implement `_.throttle` and `_.debounce`.
  var limit = function(func, wait, debounce) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var throttler = function() {
        timeout = null;
        func.apply(context, args);
      };
      if (debounce) clearTimeout(timeout);
      if (debounce || !timeout) timeout = setTimeout(throttler, wait);
    };
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    return limit(func, wait, false);
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds.
  _.debounce = function(func, wait) {
    return limit(func, wait, true);
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = slice.call(arguments);
    return function() {
      var args = slice.call(arguments);
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) { return func.apply(this, arguments); }
    };
  };


  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (hasOwnProperty.call(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (source[prop] !== void 0) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    // Check object identity.
    if (a === b) return true;
    // Different types?
    var atype = typeof(a), btype = typeof(b);
    if (atype != btype) return false;
    // Basic equality test (watch out for coercions).
    if (a == b) return true;
    // One is falsy and the other truthy.
    if ((!a && b) || (a && !b)) return false;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // One of them implements an isEqual()?
    if (a.isEqual) return a.isEqual(b);
    if (b.isEqual) return b.isEqual(a);
    // Check dates' integer values.
    if (_.isDate(a) && _.isDate(b)) return a.getTime() === b.getTime();
    // Both are NaN?
    if (_.isNaN(a) && _.isNaN(b)) return false;
    // Compare regular expressions.
    if (_.isRegExp(a) && _.isRegExp(b))
      return a.source     === b.source &&
             a.global     === b.global &&
             a.ignoreCase === b.ignoreCase &&
             a.multiline  === b.multiline;
    // If a is not an object by this point, we can't handle it.
    if (atype !== 'object') return false;
    // Check for different array lengths before comparing contents.
    if (a.length && (a.length !== b.length)) return false;
    // Nothing else worked, deep compare the contents.
    var aKeys = _.keys(a), bKeys = _.keys(b);
    // Different object sizes?
    if (aKeys.length != bKeys.length) return false;
    // Recursive comparison of contents.
    for (var key in a) if (!(key in b) || !_.isEqual(a[key], b[key])) return false;
    return true;
  };

  // Is a given array or object empty?
  _.isEmpty = function(obj) {
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (hasOwnProperty.call(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return !!(obj && hasOwnProperty.call(obj, 'callee'));
  };

  // Is a given value a function?
  _.isFunction = function(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return !!(obj === 0 || (obj && obj.toExponential && obj.toFixed));
  };

  // Is the given value `NaN`? `NaN` happens to be the only value in JavaScript
  // that does not equal itself.
  _.isNaN = function(obj) {
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false;
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return !!(obj && obj.getTimezoneOffset && obj.setUTCFullYear);
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return !!(obj && obj.test && obj.exec && (obj.ignoreCase || obj.ignoreCase === false));
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(str, data) {
    var c  = _.templateSettings;
    var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
      'with(obj||{}){__p.push(\'' +
      str.replace(/\\/g, '\\\\')
         .replace(/'/g, "\\'")
         .replace(c.interpolate, function(match, code) {
           return "'," + code.replace(/\\'/g, "'") + ",'";
         })
         .replace(c.evaluate || null, function(match, code) {
           return "');" + code.replace(/\\'/g, "'")
                              .replace(/[\r\n\t]/g, ' ') + "__p.push('";
         })
         .replace(/\r/g, '\\r')
         .replace(/\n/g, '\\n')
         .replace(/\t/g, '\\t')
         + "');}return __p.join('');";
    var func = new Function('obj', tmpl);
    return data ? func(data) : func;
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      method.apply(this._wrapped, arguments);
      return result(this._wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

})();
;
    }).call(module.exports);
    
    __require.modules["/node_modules/underscore/underscore.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/underscore.string/package.json"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/underscore.string";
    var __filename = "/node_modules/underscore.string/package.json";
    
    var require = function (file) {
        return __require(file, "/node_modules/underscore.string");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/underscore.string");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/underscore.string/package.json"]._cached = module.exports;
    
    (function () {
        module.exports = {"name":"underscore.string","version":"1.1.6","description":"String manipulation extensions for Underscore.js javascript library.","homepage":"http://epeli.github.com/underscore.string/","contributors":["Esa-Matti Suuronen <esa-matti@suuronen.org> (http://esa-matti.suuronen.org/)","Edward Tsech <edtsech@gmail.com>","Sasha Koss <kossnocorp@gmail.com> (http://koss.nocorp.me/)","Vladimir Dronnikov <dronnikov@gmail.com>","Pete Kruckenberg (<https://github.com/kruckenb>)","Paul Chavard <paul@chavard.net> (<http://tchak.net>)","Ed Finkler <coj@funkatron.com> (<http://funkatron.com>)","Pavel Pravosud <rwz@duckroll.ru>"],"keywords":["underscore","string"],"main":"./lib/underscore.string","directories":{"lib":"./lib"},"engines":{"node":"*"},"dependencies":{"underscore":"1.1.7"},"repository":{"type":"git","url":"https://github.com/epeli/underscore.string.git"},"bugs":{"url":"https://github.com/epeli/underscore.string/issues"},"licenses":[{"type":"MIT"}]};
    }).call(module.exports);
    
    __require.modules["/node_modules/underscore.string/package.json"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/underscore.string/lib/underscore.string.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/underscore.string/lib";
    var __filename = "/node_modules/underscore.string/lib/underscore.string.js";
    
    var require = function (file) {
        return __require(file, "/node_modules/underscore.string/lib");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/underscore.string/lib");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/underscore.string/lib/underscore.string.js"]._cached = module.exports;
    
    (function () {
        // Underscore.string
// (c) 2010 Esa-Matti Suuronen <esa-matti aet suuronen dot org>
// Underscore.strings is freely distributable under the terms of the MIT license.
// Documentation: https://github.com/edtsech/underscore.string
// Some code is borrowed from MooTools and Alexandru Marasteanu.

// Version 1.1.6


(function(root){
  'use strict';

  if (typeof _ != 'undefined') {
    var _reverse = _().reverse,
        _include = _.include;
  }

  // Defining helper functions.

  var nativeTrim = String.prototype.trim;

  var parseNumber = function(source) { return source * 1 || 0; };

  var strRepeat = function(i, m) {
    for (var o = []; m > 0; o[--m] = i);
    return o.join('');
  };

  var slice = function(a){
    return Array.prototype.slice.call(a);
  };

  var defaultToWhiteSpace = function(characters){
    if (characters) {
      return _s.escapeRegExp(characters);
    }
    return '\\s';
  };

  var sArgs = function(method){
    return function(){
      var args = slice(arguments);
      for(var i=0; i<args.length; i++)
        args[i] = args[i] == null ? '' : '' + args[i];
      return method.apply(null, args);
    };
  };

  // sprintf() for JavaScript 0.7-beta1
  // http://www.diveintojavascript.com/projects/javascript-sprintf
  //
  // Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
  // All rights reserved.

  var sprintf = (function() {
    function get_type(variable) {
      return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
    }

    var str_repeat = strRepeat;

    var str_format = function() {
      if (!str_format.cache.hasOwnProperty(arguments[0])) {
        str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
      }
      return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
    };

    str_format.format = function(parse_tree, argv) {
      var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
      for (i = 0; i < tree_length; i++) {
        node_type = get_type(parse_tree[i]);
        if (node_type === 'string') {
          output.push(parse_tree[i]);
        }
        else if (node_type === 'array') {
          match = parse_tree[i]; // convenience purposes only
          if (match[2]) { // keyword argument
            arg = argv[cursor];
            for (k = 0; k < match[2].length; k++) {
              if (!arg.hasOwnProperty(match[2][k])) {
                throw(sprintf('[_.sprintf] property "%s" does not exist', match[2][k]));
              }
              arg = arg[match[2][k]];
            }
          } else if (match[1]) { // positional argument (explicit)
            arg = argv[match[1]];
          }
          else { // positional argument (implicit)
            arg = argv[cursor++];
          }

          if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
            throw(sprintf('[_.sprintf] expecting number but found %s', get_type(arg)));
          }
          switch (match[8]) {
            case 'b': arg = arg.toString(2); break;
            case 'c': arg = String.fromCharCode(arg); break;
            case 'd': arg = parseInt(arg, 10); break;
            case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
            case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
            case 'o': arg = arg.toString(8); break;
            case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
            case 'u': arg = Math.abs(arg); break;
            case 'x': arg = arg.toString(16); break;
            case 'X': arg = arg.toString(16).toUpperCase(); break;
          }
          arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
          pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
          pad_length = match[6] - String(arg).length;
          pad = match[6] ? str_repeat(pad_character, pad_length) : '';
          output.push(match[5] ? arg + pad : pad + arg);
        }
      }
      return output.join('');
    };

    str_format.cache = {};

    str_format.parse = function(fmt) {
      var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
      while (_fmt) {
        if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
          parse_tree.push(match[0]);
        }
        else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
          parse_tree.push('%');
        }
        else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
          if (match[2]) {
            arg_names |= 1;
            var field_list = [], replacement_field = match[2], field_match = [];
            if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
              field_list.push(field_match[1]);
              while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                }
                else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                }
                else {
                  throw('[_.sprintf] huh?');
                }
              }
            }
            else {
              throw('[_.sprintf] huh?');
            }
            match[2] = field_list;
          }
          else {
            arg_names |= 2;
          }
          if (arg_names === 3) {
            throw('[_.sprintf] mixing positional and named placeholders is not (yet) supported');
          }
          parse_tree.push(match);
        }
        else {
          throw('[_.sprintf] huh?');
        }
        _fmt = _fmt.substring(match[0].length);
      }
      return parse_tree;
    };

    return str_format;
  })();



  // Defining underscore.string

  var _s = {

    isBlank: sArgs(function(str){
      return (/^\s*$/).test(str);
    }),

    stripTags: sArgs(function(str){
      return str.replace(/<\/?[^>]+>/ig, '');
    }),

    capitalize : sArgs(function(str) {
      return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
    }),

    chop: sArgs(function(str, step){
      step = parseNumber(step) || str.length;
      var arr = [];
      for (var i = 0; i < str.length;) {
        arr.push(str.slice(i,i + step));
        i = i + step;
      }
      return arr;
    }),

    clean: sArgs(function(str){
      return _s.strip(str.replace(/\s+/g, ' '));
    }),

    count: sArgs(function(str, substr){
      var count = 0, index;
      for (var i=0; i < str.length;) {
        index = str.indexOf(substr, i);
        index >= 0 && count++;
        i = i + (index >= 0 ? index : 0) + substr.length;
      }
      return count;
    }),

    chars: sArgs(function(str) {
      return str.split('');
    }),

    escapeHTML: sArgs(function(str) {
      return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                            .replace(/"/g, '&quot;').replace(/'/g, "&apos;");
    }),

    unescapeHTML: sArgs(function(str) {
      return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                            .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
    }),

    escapeRegExp: sArgs(function(str){
      // From MooTools core 1.2.4
      return str.replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
    }),

    insert: sArgs(function(str, i, substr){
      var arr = str.split('');
      arr.splice(parseNumber(i), 0, substr);
      return arr.join('');
    }),

    includes: sArgs(function(str, needle){
      return str.indexOf(needle) !== -1;
    }),

    include: function(obj, needle) {
      if (!_include || (/string|number/).test(typeof obj)) {
        return this.includes(obj, needle);
      } else {
        return _include(obj, needle);
      }
    },

    join: sArgs(function(sep) {
      var args = slice(arguments);
      return args.join(args.shift());
    }),

    lines: sArgs(function(str) {
      return str.split("\n");
    }),

    reverse: function(obj){
      if (!_reverse || (/string|number/).test(typeof obj)) {
        return Array.prototype.reverse.apply(String(obj).split('')).join('');
      } else {
        return _reverse.call(_(obj));
      }
    },

    splice: sArgs(function(str, i, howmany, substr){
      var arr = str.split('');
      arr.splice(parseNumber(i), parseNumber(howmany), substr);
      return arr.join('');
    }),

    startsWith: sArgs(function(str, starts){
      return str.length >= starts.length && str.substring(0, starts.length) === starts;
    }),

    endsWith: sArgs(function(str, ends){
      return str.length >= ends.length && str.substring(str.length - ends.length) === ends;
    }),

    succ: sArgs(function(str){
      var arr = str.split('');
      arr.splice(str.length-1, 1, String.fromCharCode(str.charCodeAt(str.length-1) + 1));
      return arr.join('');
    }),

    titleize: sArgs(function(str){
      var arr = str.split(' '),
          word;
      for (var i=0; i < arr.length; i++) {
        word = arr[i].split('');
        if(typeof word[0] !== 'undefined') word[0] = word[0].toUpperCase();
        i+1 === arr.length ? arr[i] = word.join('') : arr[i] = word.join('') + ' ';
      }
      return arr.join('');
    }),

    camelize: sArgs(function(str){
      return _s.trim(str).replace(/(\-|_|\s)+(.)?/g, function(match, separator, chr) {
        return chr ? chr.toUpperCase() : '';
      });
    }),

    underscored: function(str){
      return _s.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/\-|\s+/g, '_').toLowerCase();
    },

    dasherize: function(str){
      return _s.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1-$2').replace(/^([A-Z]+)/, '-$1').replace(/\_|\s+/g, '-').toLowerCase();
    },

    trim: sArgs(function(str, characters){
      if (!characters && nativeTrim) {
        return nativeTrim.call(str);
      }
      characters = defaultToWhiteSpace(characters);
      return str.replace(new RegExp('\^[' + characters + ']+|[' + characters + ']+$', 'g'), '');
    }),

    ltrim: sArgs(function(str, characters){
      characters = defaultToWhiteSpace(characters);
      return str.replace(new RegExp('\^[' + characters + ']+', 'g'), '');
    }),

    rtrim: sArgs(function(str, characters){
      characters = defaultToWhiteSpace(characters);
      return str.replace(new RegExp('[' + characters + ']+$', 'g'), '');
    }),

    truncate: sArgs(function(str, length, truncateStr){
      truncateStr = truncateStr || '...';
      length = parseNumber(length);
      return str.length > length ? str.slice(0,length) + truncateStr : str;
    }),

    /**
     * _s.prune: a more elegant version of truncate
     * prune extra chars, never leaving a half-chopped word.
     * @author github.com/sergiokas 
     */
    prune: sArgs(function(str, length, pruneStr){
      pruneStr = pruneStr || '...';
      length = parseNumber(length);
      var pruned = '';

      // Check if we're in the middle of a word
      if( str.substring(length-1, length+1).search(/^\w\w$/) === 0 )
        pruned = _s.rtrim(str.slice(0,length).replace(/([\W][\w]*)$/,''));
      else
        pruned = _s.rtrim(str.slice(0,length));
      
      pruned = pruned.replace(/\W+$/,'');
      
      return (pruned.length+pruneStr.length>str.length) ? str : pruned + pruneStr;    
    	}),
    
    words: function(str, delimiter) {
      return String(str).split(delimiter || " ");
    },

    pad: sArgs(function(str, length, padStr, type) {
      var padding = '',
          padlen  = 0;

      length = parseNumber(length);

      if (!padStr) { padStr = ' '; }
      else if (padStr.length > 1) { padStr = padStr.charAt(0); }
      switch(type) {
        case 'right':
          padlen = (length - str.length);
          padding = strRepeat(padStr, padlen);
          str = str+padding;
          break;
        case 'both':
          padlen = (length - str.length);
          padding = {
            'left' : strRepeat(padStr, Math.ceil(padlen/2)),
            'right': strRepeat(padStr, Math.floor(padlen/2))
          };
          str = padding.left+str+padding.right;
          break;
        default: // 'left'
          padlen = (length - str.length);
          padding = strRepeat(padStr, padlen);;
          str = padding+str;
        }
      return str;
    }),

    lpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr);
    },

    rpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr, 'right');
    },

    lrpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr, 'both');
    },

    sprintf: sprintf,

    vsprintf: function(fmt, argv){
      argv.unshift(fmt);
      return sprintf.apply(null, argv);
    },

    toNumber: function(str, decimals) {
      var num = parseNumber(parseNumber(str).toFixed(parseNumber(decimals)));
      return (!(num === 0 && (str !== "0" && str !== 0))) ? num : Number.NaN;
    },

    strRight: sArgs(function(sourceStr, sep){
      var pos =  (!sep) ? -1 : sourceStr.indexOf(sep);
      return (pos != -1) ? sourceStr.slice(pos+sep.length, sourceStr.length) : sourceStr;
    }),

    strRightBack: sArgs(function(sourceStr, sep){
      var pos =  (!sep) ? -1 : sourceStr.lastIndexOf(sep);
      return (pos != -1) ? sourceStr.slice(pos+sep.length, sourceStr.length) : sourceStr;
    }),

    strLeft: sArgs(function(sourceStr, sep){
      var pos = (!sep) ? -1 : sourceStr.indexOf(sep);
      return (pos != -1) ? sourceStr.slice(0, pos) : sourceStr;
    }),

    strLeftBack: sArgs(function(sourceStr, sep){
      var pos = sourceStr.lastIndexOf(sep);
      return (pos != -1) ? sourceStr.slice(0, pos) : sourceStr;
    })

  };

  // Aliases

  _s.strip  = _s.trim;
  _s.lstrip = _s.ltrim;
  _s.rstrip = _s.rtrim;
  _s.center = _s.lrpad;
  _s.ljust  = _s.lpad;
  _s.rjust  = _s.rpad;

  // CommonJS module is defined
  if (typeof module !== 'undefined' && module.exports) {
    // Export module
    module.exports = _s;

  // Integrate with Underscore.js
  } else if (typeof root._ !== 'undefined') {
    root._.mixin(_s);

  // Or define it
  } else {
    root._ = _s;
  }

}(this || window));
;
    }).call(module.exports);
    
    __require.modules["/node_modules/underscore.string/lib/underscore.string.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/support_code/world_constructor.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/support_code";
    var __filename = "/cucumber/support_code/world_constructor.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/support_code");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/support_code");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/support_code/world_constructor.js"]._cached = module.exports;
    
    (function () {
        var WorldConstructor = function() {
  return function() {};
};
module.exports = WorldConstructor;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/support_code/world_constructor.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/type.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber";
    var __filename = "/cucumber/type.js";
    
    var require = function (file) {
        return __require(file, "/cucumber");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/type.js"]._cached = module.exports;
    
    (function () {
        var Type           = {};
Type.Collection    = require('./type/collection');
Type.HashDataTable = require('./type/hash_data_table');
module.exports     = Type;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/type.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/type/collection.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/type";
    var __filename = "/cucumber/type/collection.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/type");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/type");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/type/collection.js"]._cached = module.exports;
    
    (function () {
        var Collection = function() {
  var items = new Array();
  var self = {
    add:         function add(item)                       { items.push(item); },
    getLast:     function getLast()                       { return items[items.length-1]; },
    syncForEach: function syncForEach(userFunction)       { items.forEach(userFunction); },
    forEach:     function forEach(userFunction, callback) {
      var itemsCopy = items.slice(0);
      function iterate() {
        if (itemsCopy.length > 0) {
          processItem();
        } else {
          callback();
        };
      }
      function processItem() {
        var item = itemsCopy.shift();
        userFunction(item, function() {
          iterate();
        });
      };
      iterate();
    }
  };
  return self;
};
module.exports = Collection;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/type/collection.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/type/hash_data_table.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/type";
    var __filename = "/cucumber/type/hash_data_table.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/type");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/type");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/type/hash_data_table.js"]._cached = module.exports;
    
    (function () {
        var HashDataTable = function(rawArray) {
  var self = {
    raw: function raw() {
      var hashKeys        = self.getHashKeys();
      var hashValueArrays = self.getHashValueArrays();
      var hashes          = self.createHashesFromKeysAndValueArrays(hashKeys, hashValueArrays);
      return hashes;
    },

    getHashKeys: function getHashKeys() {
      return rawArray[0];
    },

    getHashValueArrays: function getHashValueArrays() {
      var _rawArray = [].concat(rawArray);
      _rawArray.shift();
      return _rawArray;
    },

    createHashesFromKeysAndValueArrays: function createHashesFromKeysAndValueArrays(keys, valueArrays) {
      var hashes = [];
      valueArrays.forEach(function(values) {
        var hash = self.createHashFromKeysAndValues(keys, values);
        hashes.push(hash);
      });
      return hashes;
    },

    createHashFromKeysAndValues: function createHashFromKeysAndValues(keys, values) {
      var hash = {};
      var len  = keys.length;
      for (var i = 0; i < len; i++) {
        hash[keys[i]] = values[i];
      }
      return hash;
    }
  };
  return self;
};

module.exports = HashDataTable;;
    }).call(module.exports);
    
    __require.modules["/cucumber/type/hash_data_table.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/util.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber";
    var __filename = "/cucumber/util.js";
    
    var require = function (file) {
        return __require(file, "/cucumber");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/util.js"]._cached = module.exports;
    
    (function () {
        var Util       = {};
Util.Arguments = require('./util/arguments');
Util.RegExp    = require('./util/reg_exp');
module.exports = Util;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/util.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/util/arguments.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/util";
    var __filename = "/cucumber/util/arguments.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/util");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/util");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/util/arguments.js"]._cached = module.exports;
    
    (function () {
        var Arguments = function Arguments(argumentsObject) {
  return Array.prototype.slice.call(argumentsObject);
};
module.exports = Arguments;;
    }).call(module.exports);
    
    __require.modules["/cucumber/util/arguments.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/util/reg_exp.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber/util";
    var __filename = "/cucumber/util/reg_exp.js";
    
    var require = function (file) {
        return __require(file, "/cucumber/util");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber/util");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/util/reg_exp.js"]._cached = module.exports;
    
    (function () {
        var RegExp = {
  escapeString: function escapeString(string) {
    var escaped = string.replace(RegExp.ESCAPE_PATTERN, RegExp.ESCAPE_REPLACEMENT);
    return escaped;
  }
};

RegExp.ESCAPE_PATTERN     = /[-[\]{}()*+?.,\\^$|#\n\/]/g;
RegExp.ESCAPE_REPLACEMENT = "\\$&";
module.exports = RegExp;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/util/reg_exp.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/cucumber/volatile_configuration.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/cucumber";
    var __filename = "/cucumber/volatile_configuration.js";
    
    var require = function (file) {
        return __require(file, "/cucumber");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/cucumber");
    };
    
    require.modules = __require.modules;
    __require.modules["/cucumber/volatile_configuration.js"]._cached = module.exports;
    
    (function () {
        var VolatileConfiguration = function VolatileConfiguration(featureSource, supportCodeInitializer) {
  var Cucumber = require('../cucumber');

  var supportCodeLibrary = Cucumber.SupportCode.Library(supportCodeInitializer);

  var self = {
    getFeatureSources: function getFeatureSources() {
      var featureNameSourcePair = [VolatileConfiguration.FEATURE_SOURCE_NAME, featureSource];
      return [featureNameSourcePair];
    },

    getSupportCodeLibrary: function getSupportCodeLibrary() {
      return supportCodeLibrary;
    }
  };
  return self;
};
VolatileConfiguration.FEATURE_SOURCE_NAME = "(feature)";
module.exports = VolatileConfiguration;
;
    }).call(module.exports);
    
    __require.modules["/cucumber/volatile_configuration.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/gherkin/lib/gherkin/lexer/en.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/gherkin/lib/gherkin/lexer";
    var __filename = "/node_modules/gherkin/lib/gherkin/lexer/en.js";
    
    var require = function (file) {
        return __require(file, "/node_modules/gherkin/lib/gherkin/lexer");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/gherkin/lib/gherkin/lexer");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/gherkin/lib/gherkin/lexer/en.js"]._cached = module.exports;
    
    (function () {
        
/* line 1 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */
;(function() {


/* line 126 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */



/* line 11 "js/lib/gherkin/lexer/en.js" */
const _lexer_actions = [
	0, 1, 0, 1, 1, 1, 2, 1, 
	3, 1, 4, 1, 5, 1, 6, 1, 
	7, 1, 8, 1, 9, 1, 10, 1, 
	11, 1, 12, 1, 13, 1, 16, 1, 
	17, 1, 18, 1, 19, 1, 20, 1, 
	21, 1, 22, 1, 23, 2, 2, 18, 
	2, 3, 4, 2, 13, 0, 2, 14, 
	15, 2, 17, 0, 2, 17, 1, 2, 
	17, 16, 2, 17, 19, 2, 18, 6, 
	2, 18, 7, 2, 18, 8, 2, 18, 
	9, 2, 18, 10, 2, 18, 16, 2, 
	20, 21, 2, 22, 0, 2, 22, 1, 
	2, 22, 16, 2, 22, 19, 3, 4, 
	14, 15, 3, 5, 14, 15, 3, 11, 
	14, 15, 3, 12, 14, 15, 3, 13, 
	14, 15, 3, 14, 15, 18, 3, 17, 
	14, 15, 4, 2, 14, 15, 18, 4, 
	3, 4, 14, 15, 4, 17, 0, 14, 
	15
];

const _lexer_key_offsets = [
	0, 0, 19, 37, 38, 39, 41, 43, 
	48, 53, 58, 63, 67, 71, 73, 74, 
	75, 76, 77, 78, 79, 80, 81, 82, 
	83, 84, 85, 86, 87, 88, 89, 90, 
	92, 97, 104, 109, 110, 111, 113, 114, 
	115, 116, 117, 118, 119, 120, 121, 122, 
	123, 124, 139, 141, 143, 145, 147, 149, 
	151, 153, 155, 157, 159, 161, 163, 165, 
	167, 169, 187, 188, 189, 190, 191, 192, 
	193, 194, 195, 196, 197, 204, 206, 208, 
	210, 212, 214, 216, 218, 219, 220, 221, 
	222, 223, 224, 225, 226, 227, 238, 240, 
	242, 244, 246, 248, 250, 252, 254, 256, 
	258, 260, 262, 264, 266, 268, 270, 272, 
	274, 276, 278, 280, 282, 284, 286, 288, 
	290, 292, 294, 296, 298, 300, 302, 304, 
	306, 308, 310, 312, 314, 316, 318, 320, 
	322, 324, 326, 330, 333, 335, 337, 339, 
	341, 343, 345, 347, 349, 351, 353, 355, 
	356, 357, 358, 359, 360, 361, 362, 363, 
	364, 365, 366, 369, 371, 372, 373, 374, 
	375, 376, 377, 378, 379, 380, 395, 397, 
	399, 401, 403, 405, 407, 409, 411, 413, 
	415, 417, 419, 421, 423, 425, 427, 429, 
	431, 433, 435, 437, 439, 441, 443, 445, 
	447, 449, 451, 453, 455, 457, 459, 461, 
	463, 465, 467, 469, 471, 472, 473, 474, 
	475, 476, 477, 478, 479, 494, 496, 498, 
	500, 502, 504, 506, 508, 510, 512, 514, 
	516, 518, 520, 522, 524, 526, 528, 531, 
	533, 535, 537, 539, 541, 543, 545, 547, 
	549, 551, 553, 555, 557, 559, 561, 563, 
	565, 567, 569, 571, 573, 575, 577, 579, 
	581, 583, 585, 588, 591, 593, 595, 597, 
	599, 601, 603, 605, 607, 609, 611, 613, 
	615, 616, 620, 626, 629, 631, 637, 655, 
	657, 659, 661, 663, 665, 667, 669, 671, 
	673, 675, 677, 679, 681, 683, 685, 687, 
	689, 691, 693, 695, 697, 699, 702, 705, 
	707, 709, 711, 713, 715, 717, 719, 721, 
	723, 725, 727, 729, 730, 731, 732
];

const _lexer_trans_keys = [
	10, 32, 34, 35, 37, 42, 64, 65, 
	66, 69, 70, 71, 83, 84, 87, 124, 
	239, 9, 13, 10, 32, 34, 35, 37, 
	42, 64, 65, 66, 69, 70, 71, 83, 
	84, 87, 124, 9, 13, 34, 34, 10, 
	13, 10, 13, 10, 32, 34, 9, 13, 
	10, 32, 34, 9, 13, 10, 32, 34, 
	9, 13, 10, 32, 34, 9, 13, 10, 
	32, 9, 13, 10, 32, 9, 13, 10, 
	13, 10, 95, 70, 69, 65, 84, 85, 
	82, 69, 95, 69, 78, 68, 95, 37, 
	32, 10, 10, 13, 13, 32, 64, 9, 
	10, 9, 10, 13, 32, 64, 11, 12, 
	10, 32, 64, 9, 13, 110, 100, 97, 
	117, 99, 107, 103, 114, 111, 117, 110, 
	100, 58, 10, 10, 10, 32, 35, 37, 
	42, 64, 65, 66, 70, 71, 83, 84, 
	87, 9, 13, 10, 95, 10, 70, 10, 
	69, 10, 65, 10, 84, 10, 85, 10, 
	82, 10, 69, 10, 95, 10, 69, 10, 
	78, 10, 68, 10, 95, 10, 37, 10, 
	32, 10, 32, 34, 35, 37, 42, 64, 
	65, 66, 69, 70, 71, 83, 84, 87, 
	124, 9, 13, 120, 97, 109, 112, 108, 
	101, 115, 58, 10, 10, 10, 32, 35, 
	70, 124, 9, 13, 10, 101, 10, 97, 
	10, 116, 10, 117, 10, 114, 10, 101, 
	10, 58, 101, 97, 116, 117, 114, 101, 
	58, 10, 10, 10, 32, 35, 37, 64, 
	66, 69, 70, 83, 9, 13, 10, 95, 
	10, 70, 10, 69, 10, 65, 10, 84, 
	10, 85, 10, 82, 10, 69, 10, 95, 
	10, 69, 10, 78, 10, 68, 10, 95, 
	10, 37, 10, 97, 10, 99, 10, 107, 
	10, 103, 10, 114, 10, 111, 10, 117, 
	10, 110, 10, 100, 10, 58, 10, 120, 
	10, 97, 10, 109, 10, 112, 10, 108, 
	10, 101, 10, 115, 10, 101, 10, 97, 
	10, 116, 10, 117, 10, 114, 10, 101, 
	10, 99, 10, 101, 10, 110, 10, 97, 
	10, 114, 10, 105, 10, 111, 10, 32, 
	58, 115, 10, 79, 84, 10, 117, 10, 
	116, 10, 108, 10, 105, 10, 110, 10, 
	101, 10, 109, 10, 112, 10, 108, 10, 
	97, 10, 116, 105, 118, 101, 110, 99, 
	101, 110, 97, 114, 105, 111, 32, 58, 
	115, 79, 84, 117, 116, 108, 105, 110, 
	101, 58, 10, 10, 10, 32, 35, 37, 
	42, 64, 65, 66, 70, 71, 83, 84, 
	87, 9, 13, 10, 95, 10, 70, 10, 
	69, 10, 65, 10, 84, 10, 85, 10, 
	82, 10, 69, 10, 95, 10, 69, 10, 
	78, 10, 68, 10, 95, 10, 37, 10, 
	32, 10, 110, 10, 100, 10, 117, 10, 
	116, 10, 101, 10, 97, 10, 116, 10, 
	117, 10, 114, 10, 101, 10, 58, 10, 
	105, 10, 118, 10, 101, 10, 110, 10, 
	99, 10, 101, 10, 110, 10, 97, 10, 
	114, 10, 105, 10, 111, 10, 104, 101, 
	109, 112, 108, 97, 116, 10, 10, 10, 
	32, 35, 37, 42, 64, 65, 66, 70, 
	71, 83, 84, 87, 9, 13, 10, 95, 
	10, 70, 10, 69, 10, 65, 10, 84, 
	10, 85, 10, 82, 10, 69, 10, 95, 
	10, 69, 10, 78, 10, 68, 10, 95, 
	10, 37, 10, 32, 10, 110, 10, 100, 
	10, 97, 117, 10, 99, 10, 107, 10, 
	103, 10, 114, 10, 111, 10, 117, 10, 
	110, 10, 100, 10, 58, 10, 116, 10, 
	101, 10, 97, 10, 116, 10, 117, 10, 
	114, 10, 101, 10, 105, 10, 118, 10, 
	101, 10, 110, 10, 99, 10, 101, 10, 
	110, 10, 97, 10, 114, 10, 105, 10, 
	111, 10, 32, 58, 10, 79, 84, 10, 
	117, 10, 116, 10, 108, 10, 105, 10, 
	110, 10, 101, 10, 109, 10, 112, 10, 
	108, 10, 97, 10, 116, 10, 104, 104, 
	32, 124, 9, 13, 10, 32, 92, 124, 
	9, 13, 10, 92, 124, 10, 92, 10, 
	32, 92, 124, 9, 13, 10, 32, 34, 
	35, 37, 42, 64, 65, 66, 69, 70, 
	71, 83, 84, 87, 124, 9, 13, 10, 
	110, 10, 100, 10, 117, 10, 116, 10, 
	101, 10, 97, 10, 116, 10, 117, 10, 
	114, 10, 101, 10, 58, 10, 105, 10, 
	118, 10, 101, 10, 110, 10, 99, 10, 
	101, 10, 110, 10, 97, 10, 114, 10, 
	105, 10, 111, 10, 32, 58, 10, 79, 
	84, 10, 117, 10, 116, 10, 108, 10, 
	105, 10, 110, 10, 101, 10, 109, 10, 
	112, 10, 108, 10, 97, 10, 116, 10, 
	104, 116, 187, 191, 0
];

const _lexer_single_lengths = [
	0, 17, 16, 1, 1, 2, 2, 3, 
	3, 3, 3, 2, 2, 2, 1, 1, 
	1, 1, 1, 1, 1, 1, 1, 1, 
	1, 1, 1, 1, 1, 1, 1, 2, 
	3, 5, 3, 1, 1, 2, 1, 1, 
	1, 1, 1, 1, 1, 1, 1, 1, 
	1, 13, 2, 2, 2, 2, 2, 2, 
	2, 2, 2, 2, 2, 2, 2, 2, 
	2, 16, 1, 1, 1, 1, 1, 1, 
	1, 1, 1, 1, 5, 2, 2, 2, 
	2, 2, 2, 2, 1, 1, 1, 1, 
	1, 1, 1, 1, 1, 9, 2, 2, 
	2, 2, 2, 2, 2, 2, 2, 2, 
	2, 2, 2, 2, 2, 2, 2, 2, 
	2, 2, 2, 2, 2, 2, 2, 2, 
	2, 2, 2, 2, 2, 2, 2, 2, 
	2, 2, 2, 2, 2, 2, 2, 2, 
	2, 2, 4, 3, 2, 2, 2, 2, 
	2, 2, 2, 2, 2, 2, 2, 1, 
	1, 1, 1, 1, 1, 1, 1, 1, 
	1, 1, 3, 2, 1, 1, 1, 1, 
	1, 1, 1, 1, 1, 13, 2, 2, 
	2, 2, 2, 2, 2, 2, 2, 2, 
	2, 2, 2, 2, 2, 2, 2, 2, 
	2, 2, 2, 2, 2, 2, 2, 2, 
	2, 2, 2, 2, 2, 2, 2, 2, 
	2, 2, 2, 2, 1, 1, 1, 1, 
	1, 1, 1, 1, 13, 2, 2, 2, 
	2, 2, 2, 2, 2, 2, 2, 2, 
	2, 2, 2, 2, 2, 2, 3, 2, 
	2, 2, 2, 2, 2, 2, 2, 2, 
	2, 2, 2, 2, 2, 2, 2, 2, 
	2, 2, 2, 2, 2, 2, 2, 2, 
	2, 2, 3, 3, 2, 2, 2, 2, 
	2, 2, 2, 2, 2, 2, 2, 2, 
	1, 2, 4, 3, 2, 4, 16, 2, 
	2, 2, 2, 2, 2, 2, 2, 2, 
	2, 2, 2, 2, 2, 2, 2, 2, 
	2, 2, 2, 2, 2, 3, 3, 2, 
	2, 2, 2, 2, 2, 2, 2, 2, 
	2, 2, 2, 1, 1, 1, 0
];

const _lexer_range_lengths = [
	0, 1, 1, 0, 0, 0, 0, 1, 
	1, 1, 1, 1, 1, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	1, 1, 1, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 1, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 1, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 1, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 1, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 1, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 1, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 1, 1, 0, 0, 1, 1, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0
];

const _lexer_index_offsets = [
	0, 0, 19, 37, 39, 41, 44, 47, 
	52, 57, 62, 67, 71, 75, 78, 80, 
	82, 84, 86, 88, 90, 92, 94, 96, 
	98, 100, 102, 104, 106, 108, 110, 112, 
	115, 120, 127, 132, 134, 136, 139, 141, 
	143, 145, 147, 149, 151, 153, 155, 157, 
	159, 161, 176, 179, 182, 185, 188, 191, 
	194, 197, 200, 203, 206, 209, 212, 215, 
	218, 221, 239, 241, 243, 245, 247, 249, 
	251, 253, 255, 257, 259, 266, 269, 272, 
	275, 278, 281, 284, 287, 289, 291, 293, 
	295, 297, 299, 301, 303, 305, 316, 319, 
	322, 325, 328, 331, 334, 337, 340, 343, 
	346, 349, 352, 355, 358, 361, 364, 367, 
	370, 373, 376, 379, 382, 385, 388, 391, 
	394, 397, 400, 403, 406, 409, 412, 415, 
	418, 421, 424, 427, 430, 433, 436, 439, 
	442, 445, 448, 453, 457, 460, 463, 466, 
	469, 472, 475, 478, 481, 484, 487, 490, 
	492, 494, 496, 498, 500, 502, 504, 506, 
	508, 510, 512, 516, 519, 521, 523, 525, 
	527, 529, 531, 533, 535, 537, 552, 555, 
	558, 561, 564, 567, 570, 573, 576, 579, 
	582, 585, 588, 591, 594, 597, 600, 603, 
	606, 609, 612, 615, 618, 621, 624, 627, 
	630, 633, 636, 639, 642, 645, 648, 651, 
	654, 657, 660, 663, 666, 668, 670, 672, 
	674, 676, 678, 680, 682, 697, 700, 703, 
	706, 709, 712, 715, 718, 721, 724, 727, 
	730, 733, 736, 739, 742, 745, 748, 752, 
	755, 758, 761, 764, 767, 770, 773, 776, 
	779, 782, 785, 788, 791, 794, 797, 800, 
	803, 806, 809, 812, 815, 818, 821, 824, 
	827, 830, 833, 837, 841, 844, 847, 850, 
	853, 856, 859, 862, 865, 868, 871, 874, 
	877, 879, 883, 889, 893, 896, 902, 920, 
	923, 926, 929, 932, 935, 938, 941, 944, 
	947, 950, 953, 956, 959, 962, 965, 968, 
	971, 974, 977, 980, 983, 986, 990, 994, 
	997, 1000, 1003, 1006, 1009, 1012, 1015, 1018, 
	1021, 1024, 1027, 1030, 1032, 1034, 1036
];

const _lexer_indicies = [
	2, 1, 3, 4, 5, 6, 7, 8, 
	9, 10, 11, 12, 13, 14, 14, 15, 
	16, 1, 0, 2, 1, 3, 4, 5, 
	6, 7, 8, 9, 10, 11, 12, 13, 
	14, 14, 15, 1, 0, 17, 0, 18, 
	0, 20, 21, 19, 23, 24, 22, 27, 
	26, 28, 26, 25, 31, 30, 32, 30, 
	29, 31, 30, 33, 30, 29, 31, 30, 
	34, 30, 29, 36, 35, 35, 0, 2, 
	37, 37, 0, 39, 40, 38, 2, 0, 
	41, 0, 42, 0, 43, 0, 44, 0, 
	45, 0, 46, 0, 47, 0, 48, 0, 
	49, 0, 50, 0, 51, 0, 52, 0, 
	53, 0, 54, 0, 55, 0, 0, 56, 
	58, 59, 57, 0, 0, 0, 0, 60, 
	61, 62, 61, 61, 64, 63, 60, 2, 
	65, 7, 65, 0, 66, 0, 67, 0, 
	68, 69, 0, 70, 0, 71, 0, 72, 
	0, 73, 0, 74, 0, 75, 0, 76, 
	0, 77, 0, 78, 0, 80, 79, 82, 
	81, 82, 83, 84, 85, 86, 84, 87, 
	88, 89, 90, 91, 92, 92, 83, 81, 
	82, 93, 81, 82, 94, 81, 82, 95, 
	81, 82, 96, 81, 82, 97, 81, 82, 
	98, 81, 82, 99, 81, 82, 100, 81, 
	82, 101, 81, 82, 102, 81, 82, 103, 
	81, 82, 104, 81, 82, 105, 81, 82, 
	106, 81, 82, 107, 81, 109, 108, 110, 
	111, 112, 113, 114, 115, 116, 117, 118, 
	119, 120, 121, 121, 122, 108, 0, 123, 
	0, 124, 0, 125, 0, 126, 0, 127, 
	0, 128, 0, 129, 0, 130, 0, 132, 
	131, 134, 133, 134, 135, 136, 137, 136, 
	135, 133, 134, 138, 133, 134, 139, 133, 
	134, 140, 133, 134, 141, 133, 134, 142, 
	133, 134, 143, 133, 134, 144, 133, 145, 
	0, 146, 0, 147, 0, 148, 0, 149, 
	0, 150, 0, 151, 0, 153, 152, 155, 
	154, 155, 156, 157, 158, 157, 159, 160, 
	161, 162, 156, 154, 155, 163, 154, 155, 
	164, 154, 155, 165, 154, 155, 166, 154, 
	155, 167, 154, 155, 168, 154, 155, 169, 
	154, 155, 170, 154, 155, 171, 154, 155, 
	172, 154, 155, 173, 154, 155, 174, 154, 
	155, 175, 154, 155, 176, 154, 155, 177, 
	154, 155, 178, 154, 155, 179, 154, 155, 
	180, 154, 155, 181, 154, 155, 182, 154, 
	155, 183, 154, 155, 184, 154, 155, 185, 
	154, 155, 186, 154, 155, 187, 154, 155, 
	188, 154, 155, 189, 154, 155, 190, 154, 
	155, 191, 154, 155, 192, 154, 155, 185, 
	154, 155, 193, 154, 155, 194, 154, 155, 
	195, 154, 155, 196, 154, 155, 197, 154, 
	155, 185, 154, 155, 198, 154, 155, 199, 
	154, 155, 200, 154, 155, 201, 154, 155, 
	202, 154, 155, 203, 154, 155, 204, 154, 
	155, 205, 186, 185, 154, 155, 206, 207, 
	154, 155, 208, 154, 155, 209, 154, 155, 
	210, 154, 155, 211, 154, 155, 197, 154, 
	155, 212, 154, 155, 213, 154, 155, 214, 
	154, 155, 215, 154, 155, 216, 154, 155, 
	197, 154, 217, 0, 218, 0, 219, 0, 
	67, 0, 220, 0, 221, 0, 222, 0, 
	223, 0, 224, 0, 225, 0, 226, 0, 
	227, 228, 129, 0, 229, 230, 0, 231, 
	0, 232, 0, 233, 0, 234, 0, 235, 
	0, 236, 0, 237, 0, 239, 238, 241, 
	240, 241, 242, 243, 244, 245, 243, 246, 
	247, 248, 249, 250, 251, 251, 242, 240, 
	241, 252, 240, 241, 253, 240, 241, 254, 
	240, 241, 255, 240, 241, 256, 240, 241, 
	257, 240, 241, 258, 240, 241, 259, 240, 
	241, 260, 240, 241, 261, 240, 241, 262, 
	240, 241, 263, 240, 241, 264, 240, 241, 
	265, 240, 241, 266, 240, 241, 267, 240, 
	241, 268, 240, 241, 269, 240, 241, 268, 
	240, 241, 270, 240, 241, 271, 240, 241, 
	272, 240, 241, 273, 240, 241, 274, 240, 
	241, 275, 240, 241, 266, 240, 241, 276, 
	240, 241, 277, 240, 241, 278, 240, 241, 
	268, 240, 241, 279, 240, 241, 280, 240, 
	241, 281, 240, 241, 282, 240, 241, 283, 
	240, 241, 284, 240, 241, 275, 240, 241, 
	277, 240, 285, 0, 286, 0, 287, 0, 
	288, 0, 289, 0, 235, 0, 291, 290, 
	293, 292, 293, 294, 295, 296, 297, 295, 
	298, 299, 300, 301, 302, 303, 303, 294, 
	292, 293, 304, 292, 293, 305, 292, 293, 
	306, 292, 293, 307, 292, 293, 308, 292, 
	293, 309, 292, 293, 310, 292, 293, 311, 
	292, 293, 312, 292, 293, 313, 292, 293, 
	314, 292, 293, 315, 292, 293, 316, 292, 
	293, 317, 292, 293, 318, 292, 293, 319, 
	292, 293, 320, 292, 293, 321, 322, 292, 
	293, 323, 292, 293, 324, 292, 293, 325, 
	292, 293, 326, 292, 293, 327, 292, 293, 
	328, 292, 293, 329, 292, 293, 330, 292, 
	293, 318, 292, 293, 320, 292, 293, 331, 
	292, 293, 332, 292, 293, 333, 292, 293, 
	334, 292, 293, 335, 292, 293, 330, 292, 
	293, 336, 292, 293, 337, 292, 293, 338, 
	292, 293, 320, 292, 293, 339, 292, 293, 
	340, 292, 293, 341, 292, 293, 342, 292, 
	293, 343, 292, 293, 344, 292, 293, 345, 
	292, 293, 346, 318, 292, 293, 347, 348, 
	292, 293, 349, 292, 293, 350, 292, 293, 
	351, 292, 293, 352, 292, 293, 335, 292, 
	293, 353, 292, 293, 354, 292, 293, 355, 
	292, 293, 356, 292, 293, 357, 292, 293, 
	335, 292, 293, 337, 292, 218, 0, 358, 
	359, 358, 0, 362, 361, 363, 364, 361, 
	360, 0, 366, 367, 365, 0, 366, 365, 
	362, 368, 366, 367, 368, 365, 362, 369, 
	370, 371, 372, 373, 374, 375, 376, 377, 
	378, 379, 380, 381, 381, 382, 369, 0, 
	82, 383, 81, 82, 384, 81, 82, 385, 
	81, 82, 384, 81, 82, 386, 81, 82, 
	387, 81, 82, 388, 81, 82, 389, 81, 
	82, 390, 81, 82, 391, 81, 82, 107, 
	81, 82, 392, 81, 82, 393, 81, 82, 
	394, 81, 82, 384, 81, 82, 395, 81, 
	82, 396, 81, 82, 397, 81, 82, 398, 
	81, 82, 399, 81, 82, 400, 81, 82, 
	401, 81, 82, 402, 107, 81, 82, 403, 
	404, 81, 82, 405, 81, 82, 406, 81, 
	82, 407, 81, 82, 408, 81, 82, 390, 
	81, 82, 409, 81, 82, 410, 81, 82, 
	411, 81, 82, 412, 81, 82, 413, 81, 
	82, 390, 81, 82, 393, 81, 67, 0, 
	414, 0, 1, 0, 415, 0
];

const _lexer_trans_targs = [
	0, 2, 2, 3, 13, 15, 29, 32, 
	35, 37, 66, 84, 151, 155, 280, 281, 
	324, 4, 5, 6, 7, 6, 6, 7, 
	6, 8, 8, 8, 9, 8, 8, 8, 
	9, 10, 11, 12, 2, 12, 13, 2, 
	14, 16, 17, 18, 19, 20, 21, 22, 
	23, 24, 25, 26, 27, 28, 326, 30, 
	31, 31, 2, 14, 33, 34, 2, 33, 
	32, 34, 36, 29, 38, 323, 39, 40, 
	41, 42, 43, 44, 45, 46, 47, 48, 
	49, 48, 49, 49, 2, 50, 64, 287, 
	289, 291, 298, 302, 322, 51, 52, 53, 
	54, 55, 56, 57, 58, 59, 60, 61, 
	62, 63, 2, 65, 2, 2, 3, 13, 
	15, 29, 32, 35, 37, 66, 84, 151, 
	155, 280, 281, 67, 68, 69, 70, 71, 
	72, 73, 74, 75, 76, 75, 76, 76, 
	2, 77, 78, 79, 80, 81, 82, 83, 
	65, 85, 86, 87, 88, 89, 90, 91, 
	92, 93, 92, 93, 93, 2, 94, 108, 
	118, 125, 131, 95, 96, 97, 98, 99, 
	100, 101, 102, 103, 104, 105, 106, 107, 
	2, 109, 110, 111, 112, 113, 114, 115, 
	116, 117, 65, 119, 120, 121, 122, 123, 
	124, 126, 127, 128, 129, 130, 132, 133, 
	134, 135, 136, 137, 138, 139, 140, 145, 
	141, 142, 143, 144, 146, 147, 148, 149, 
	150, 152, 153, 154, 156, 157, 158, 159, 
	160, 161, 162, 163, 218, 164, 212, 165, 
	166, 167, 168, 169, 170, 171, 172, 173, 
	172, 173, 173, 2, 174, 188, 189, 191, 
	193, 200, 204, 211, 175, 176, 177, 178, 
	179, 180, 181, 182, 183, 184, 185, 186, 
	187, 2, 65, 190, 188, 192, 194, 195, 
	196, 197, 198, 199, 201, 202, 203, 205, 
	206, 207, 208, 209, 210, 213, 214, 215, 
	216, 217, 219, 220, 219, 220, 220, 2, 
	221, 235, 236, 238, 249, 255, 259, 279, 
	222, 223, 224, 225, 226, 227, 228, 229, 
	230, 231, 232, 233, 234, 2, 65, 237, 
	235, 239, 248, 240, 241, 242, 243, 244, 
	245, 246, 247, 250, 251, 252, 253, 254, 
	256, 257, 258, 260, 261, 262, 263, 264, 
	265, 266, 267, 268, 273, 269, 270, 271, 
	272, 274, 275, 276, 277, 278, 281, 282, 
	283, 285, 286, 284, 282, 283, 284, 282, 
	285, 286, 3, 13, 15, 29, 32, 35, 
	37, 66, 84, 151, 155, 280, 281, 288, 
	64, 290, 292, 293, 294, 295, 296, 297, 
	299, 300, 301, 303, 304, 305, 306, 307, 
	308, 309, 310, 311, 316, 312, 313, 314, 
	315, 317, 318, 319, 320, 321, 325, 0
];

const _lexer_trans_actions = [
	43, 0, 54, 3, 1, 0, 29, 1, 
	29, 29, 29, 29, 29, 29, 29, 35, 
	0, 0, 0, 7, 135, 48, 0, 102, 
	9, 5, 45, 130, 45, 0, 33, 122, 
	33, 33, 0, 11, 106, 0, 0, 114, 
	25, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	57, 0, 110, 23, 0, 27, 118, 27, 
	51, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 57, 
	140, 0, 54, 0, 72, 33, 84, 84, 
	84, 84, 84, 84, 84, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 15, 15, 31, 126, 60, 57, 
	31, 63, 57, 63, 63, 63, 63, 63, 
	63, 63, 66, 0, 0, 0, 0, 0, 
	0, 0, 0, 57, 140, 0, 54, 0, 
	81, 84, 0, 0, 0, 0, 0, 0, 
	21, 0, 0, 0, 0, 0, 0, 0, 
	57, 140, 0, 54, 0, 69, 33, 84, 
	84, 84, 84, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	13, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 13, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 57, 140, 
	0, 54, 0, 78, 33, 84, 84, 84, 
	84, 84, 84, 84, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 19, 19, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 57, 140, 0, 54, 0, 75, 
	33, 84, 84, 84, 84, 84, 84, 84, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 17, 17, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	37, 37, 54, 37, 87, 0, 0, 39, 
	0, 0, 93, 90, 41, 96, 90, 96, 
	96, 96, 96, 96, 96, 96, 99, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0
];

const _lexer_eof_actions = [
	0, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43, 43, 
	43, 43, 43, 43, 43, 43, 43
];

const lexer_start = 1;
const lexer_first_final = 326;
const lexer_error = 0;

const lexer_en_main = 1;


/* line 129 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

/* line 130 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

/* line 131 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

var Lexer = function(listener) {
  // Check that listener has the required functions
  var events = ['comment', 'tag', 'feature', 'background', 'scenario', 'scenario_outline', 'examples', 'step', 'doc_string', 'row', 'eof'];
  for(e in events) {
    var event = events[e];
    if(typeof listener[event] != 'function') {
      "Error. No " + event + " function exists on " + JSON.stringify(listener);
    }
  }
  this.listener = listener;  
};

Lexer.prototype.scan = function(data) {
  var ending = "\n%_FEATURE_END_%";
  if(typeof data == 'string') {
    data = this.stringToBytes(data + ending);
  } else if(typeof Buffer != 'undefined' && Buffer.isBuffer(data)) {
    // Node.js
    var buf = new Buffer(data.length + ending.length);
    data.copy(buf, 0, 0);
    new Buffer(ending).copy(buf, data.length, 0);
    data = buf;
  }
  var eof = pe = data.length;
  var p = 0;

  this.line_number = 1;
  this.last_newline = 0;

  
/* line 635 "js/lib/gherkin/lexer/en.js" */
{
	  this.cs = lexer_start;
} /* JSCodeGen::writeInit */

/* line 162 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */
  
/* line 642 "js/lib/gherkin/lexer/en.js" */
{
	var _klen, _trans, _keys, _ps, _widec, _acts, _nacts;
	var _goto_level, _resume, _eof_trans, _again, _test_eof;
	var _out;
	_klen = _trans = _keys = _acts = _nacts = null;
	_goto_level = 0;
	_resume = 10;
	_eof_trans = 15;
	_again = 20;
	_test_eof = 30;
	_out = 40;
	while (true) {
	_trigger_goto = false;
	if (_goto_level <= 0) {
	if (p == pe) {
		_goto_level = _test_eof;
		continue;
	}
	if ( this.cs == 0) {
		_goto_level = _out;
		continue;
	}
	}
	if (_goto_level <= _resume) {
	_keys = _lexer_key_offsets[ this.cs];
	_trans = _lexer_index_offsets[ this.cs];
	_klen = _lexer_single_lengths[ this.cs];
	_break_match = false;
	
	do {
	  if (_klen > 0) {
	     _lower = _keys;
	     _upper = _keys + _klen - 1;

	     while (true) {
	        if (_upper < _lower) { break; }
	        _mid = _lower + ( (_upper - _lower) >> 1 );

	        if ( data[p] < _lexer_trans_keys[_mid]) {
	           _upper = _mid - 1;
	        } else if ( data[p] > _lexer_trans_keys[_mid]) {
	           _lower = _mid + 1;
	        } else {
	           _trans += (_mid - _keys);
	           _break_match = true;
	           break;
	        };
	     } /* while */
	     if (_break_match) { break; }
	     _keys += _klen;
	     _trans += _klen;
	  }
	  _klen = _lexer_range_lengths[ this.cs];
	  if (_klen > 0) {
	     _lower = _keys;
	     _upper = _keys + (_klen << 1) - 2;
	     while (true) {
	        if (_upper < _lower) { break; }
	        _mid = _lower + (((_upper-_lower) >> 1) & ~1);
	        if ( data[p] < _lexer_trans_keys[_mid]) {
	          _upper = _mid - 2;
	         } else if ( data[p] > _lexer_trans_keys[_mid+1]) {
	          _lower = _mid + 2;
	        } else {
	          _trans += ((_mid - _keys) >> 1);
	          _break_match = true;
	          break;
	        }
	     } /* while */
	     if (_break_match) { break; }
	     _trans += _klen
	  }
	} while (false);
	_trans = _lexer_indicies[_trans];
	 this.cs = _lexer_trans_targs[_trans];
	if (_lexer_trans_actions[_trans] != 0) {
		_acts = _lexer_trans_actions[_trans];
		_nacts = _lexer_actions[_acts];
		_acts += 1;
		while (_nacts > 0) {
			_nacts -= 1;
			_acts += 1;
			switch (_lexer_actions[_acts - 1]) {
case 0:
/* line 6 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    this.content_start = p;
    this.current_line = this.line_number;
    this.start_col = p - this.last_newline - (this.keyword+':').length;
  		break;
case 1:
/* line 12 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    this.current_line = this.line_number;
    this.start_col = p - this.last_newline;
  		break;
case 2:
/* line 17 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    this.content_start = p;
  		break;
case 3:
/* line 21 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    this.docstring_content_type_start = p;
  		break;
case 4:
/* line 25 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    this.docstring_content_type_end = p;
  		break;
case 5:
/* line 29 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    var con = this.unindent(
      this.start_col, 
      this.bytesToString(data.slice(this.content_start, this.next_keyword_start-1)).replace(/(\r?\n)?([\t ])*$/, '').replace(/\\\"\\\"\\\"/mg, '"""')
    );
    var con_type = this.bytesToString(data.slice(this.docstring_content_type_start, this.docstring_content_type_end)).trim();
    this.listener.doc_string(con_type, con, this.current_line); 
  		break;
case 6:
/* line 38 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    p = this.store_keyword_content('feature', data, p, eof);
  		break;
case 7:
/* line 42 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    p = this.store_keyword_content('background', data, p, eof);
  		break;
case 8:
/* line 46 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    p = this.store_keyword_content('scenario', data, p, eof);
  		break;
case 9:
/* line 50 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    p = this.store_keyword_content('scenario_outline', data, p, eof);
  		break;
case 10:
/* line 54 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    p = this.store_keyword_content('examples', data, p, eof);
  		break;
case 11:
/* line 58 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    var con = this.bytesToString(data.slice(this.content_start, p)).trim();
    this.listener.step(this.keyword, con, this.current_line);
  		break;
case 12:
/* line 63 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    var con = this.bytesToString(data.slice(this.content_start, p)).trim();
    this.listener.comment(con, this.line_number);
    this.keyword_start = null;
  		break;
case 13:
/* line 69 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    var con = this.bytesToString(data.slice(this.content_start, p)).trim();
    this.listener.tag(con, this.line_number);
    this.keyword_start = null;
  		break;
case 14:
/* line 75 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    this.line_number++;
  		break;
case 15:
/* line 79 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    this.last_newline = p + 1;
  		break;
case 16:
/* line 83 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    this.keyword_start = this.keyword_start || p;
  		break;
case 17:
/* line 87 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    this.keyword = this.bytesToString(data.slice(this.keyword_start, p)).replace(/:$/, '');
    this.keyword_start = null;
  		break;
case 18:
/* line 92 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    this.next_keyword_start = p;
  		break;
case 19:
/* line 96 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    p = p - 1;
    current_row = [];
    this.current_line = this.line_number;
  		break;
case 20:
/* line 102 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    this.content_start = p;
  		break;
case 21:
/* line 106 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    var con = this.bytesToString(data.slice(this.content_start, p)).trim();
    current_row.push(con.replace(/\\\|/, "|").replace(/\\n/, "\n").replace(/\\\\/, "\\"));
  		break;
case 22:
/* line 111 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    this.listener.row(current_row, this.current_line);
  		break;
case 23:
/* line 115 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    if(this.cs < lexer_first_final) {
      var content = this.current_line_content(data, p);
      throw "Lexing error on line " + this.line_number + ": '" + content + "'. See http://wiki.github.com/cucumber/gherkin/lexingerror for more information.";
    } else {
      this.listener.eof();
    }
    
  		break;
/* line 869 "js/lib/gherkin/lexer/en.js" */
			} /* action switch */
		}
	}
	if (_trigger_goto) {
		continue;
	}
	}
	if (_goto_level <= _again) {
	if ( this.cs == 0) {
		_goto_level = _out;
		continue;
	}
	p += 1;
	if (p != pe) {
		_goto_level = _resume;
		continue;
	}
	}
	if (_goto_level <= _test_eof) {
	if (p == eof) {
	__acts = _lexer_eof_actions[ this.cs];
	__nacts =  _lexer_actions[__acts];
	__acts += 1;
	while (__nacts > 0) {
		__nacts -= 1;
		__acts += 1;
		switch (_lexer_actions[__acts - 1]) {
case 23:
/* line 115 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */

    if(this.cs < lexer_first_final) {
      var content = this.current_line_content(data, p);
      throw "Lexing error on line " + this.line_number + ": '" + content + "'. See http://wiki.github.com/cucumber/gherkin/lexingerror for more information.";
    } else {
      this.listener.eof();
    }
    
  		break;
/* line 908 "js/lib/gherkin/lexer/en.js" */
		} /* eof action switch */
	}
	if (_trigger_goto) {
		continue;
	}
}
	}
	if (_goto_level <= _out) {
		break;
	}
	}
	}

/* line 163 "/Users/ahellesoy/scm/gherkin/tasks/../ragel/i18n/en.js.rl" */
};

Lexer.prototype.bytesToString = function(bytes) {
  if(typeof bytes.write == 'function') {
    // Node.js
    return bytes.toString('utf-8');
  } else {
    var result = "";
    for(var b in bytes) {
      result += String.fromCharCode(bytes[b]);
    }
    return result;
  }
};

Lexer.prototype.stringToBytes = function(string) {
  var bytes = [];
  for(var i = 0; i < string.length; i++) {
    bytes[i] = string.charCodeAt(i);
  }
  return bytes;
};

Lexer.prototype.unindent = function(startcol, text) {
  startcol = startcol || 0;
  return text.replace(new RegExp('^[\t ]{0,' + startcol + '}', 'gm'), ''); 
};

Lexer.prototype.store_keyword_content = function(event, data, p, eof) {
  var end_point = (!this.next_keyword_start || (p == eof)) ? p : this.next_keyword_start;
  var content = this.unindent(this.start_col + 2, this.bytesToString(data.slice(this.content_start, end_point))).replace(/\s+$/,"");
  var content_lines = content.split("\n")
  var name = content_lines.shift() || "";
  name = name.trim();
  var description = content_lines.join("\n");
  this.listener[event](this.keyword, name, description, this.current_line);
  var nks = this.next_keyword_start;
  this.next_keyword_start = null;
  return nks ? nks - 1 : p;
};

Lexer.prototype.current_line_content = function(data, p) {
  var rest = data.slice(this.last_newline, -1);
  var end = rest.indexOf(10) || -1;
  return this.bytesToString(rest.slice(0, end)).trim();
};

// Node.js export
if(typeof exports !== 'undefined') {
  exports.Lexer = Lexer;
}
// Require.js export
if (typeof define !== 'undefined' && define.amd) {
  define('gherkin/lexer/en', [], function() {return Lexer});
}

})();
;
    }).call(module.exports);
    
    __require.modules["/node_modules/gherkin/lib/gherkin/lexer/en.js"]._cached = module.exports;
    return module.exports;
};

require.alias("./lib/cucumber.js", "/node_modules/cucumber");

require.alias("gherkin/lib/gherkin/lexer/en", "./gherkin/lexer/en");
