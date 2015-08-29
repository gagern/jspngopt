"use strict";

var Optimizer = require("./OptimizerFS");

process.nextTick(main);

function main() {
  var opt = new Optimizer();
  for (var i = 2; i < process.argv.length; ++i) {
    opt.fileSync(process.argv[i]);
  }
}
