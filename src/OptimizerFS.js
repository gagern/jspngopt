"use strict";

// keep filesystem-dependent stuff outside the scope for browserify

var fs = require("fs");
var util = require("util");

var Optimizer = require("./Optimizer");

function OptimizerFS() {
  Optimizer.apply(this, arguments);
}

util.inherits(OptimizerFS, Optimizer);

OptimizerFS.prototype.fileSync = function(path) {
  var before = fs.readFileSync(path);
  var after = this.bufferSync(before);
  if (after.length >= before.length)
    return false;
  fs.writeFileSync(path, after);
  return true;
};

module.exports = OptimizerFS;
