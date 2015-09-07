"use strict";

function Parameters(arg) {
  for (var i = 0; i < this.keys.length; ++i) {
    var key = this.keys[i];
    this[key] = +arg[key];
  }
}

Parameters.prototype.keys = [
  "filter",
  "interlace",
  "windowBits",
  "level",
  "memLevel",
  "strategy",
];

Parameters.prototype.toString = function() {
  var parts = [];
  for (var i = 0; i < this.keys.length; ++i) {
    var key = this.keys[i];
    var val = this[key].toString();
    if (key === "windowBits" && val.length < 2) val = "0" + val;
    parts.push(key.charAt(0) + val);
  }
  return parts.join(" ");
};

Parameters.expand = function(matrices) {
  var keys = Parameters.prototype.keys;
  var n = keys.length;
  var state = {};
  var res = [];
  var seen = {};
  var matrix;

  function recurse(i) {
    if (i === n) {
      var p = new Parameters(state);
      if (!seen[p]) {
        seen[p] = p;
        res.push(p);
      }
    } else {
      var key = keys[i];
      var lst = matrix[key];
      for (var j = 0; j < lst.length; ++j) {
        state[key] = lst[j];
        recurse(i + 1);
      }
    }
  }

  for (var i = 0; i < matrices.length; ++i) {
    matrix = matrices[i];
    recurse(0);
  }
  return res;
};

module.exports = Parameters;
