"use strict";

var fs = require("fs");
var pako = require("pako");
var should = require("should");
var crc32 = require("buffer-crc32");

var Optimizer = require("../src/Optimizer");

describe("Optimizer", function() {
  var path = require.resolve("vendor-icons/dist/64x64/nodejs.png");
  var png = fs.readFileSync(path);

  var easyMatrix = [{
    filter: [0, 5],
    interlace: [0],
    windowBits: [8],
    level: [5],
    memLevel: [5],
    strategy: [0, 1],
  }];

  it("can optimize synchroneously", function() {
    var opt = new Optimizer();
    var compressed = opt.bufferSync(png);
    Buffer.isBuffer(compressed).should.be.true();
    compressed.length.should.be.below(png.length);
  });

  it("can use pako for reproducible results", function() {
    var opt = new Optimizer({pako:pako});
    var compressed = opt.bufferSync(png);
    Buffer.isBuffer(compressed).should.be.true();
    compressed.length.should.equal(3278);
    crc32(compressed).readUInt32BE(0).should.equal(0xb3d3677a);
  });

  it("will be silent on verbosity == 0", function() {
    var gotOutput = false;
    var logFun = function() { gotOutput = true; };
    var oldLog = console.log;
    try {
      console.log = logFun;
      var opt = new Optimizer({
        matrices: easyMatrix,
        logFun: logFun
      });
      var compressed = opt.bufferSync(png);
    } catch (e) {
      console.log = oldLog;
      throw e;
    }
    console.log = oldLog;
    gotOutput.should.be.false();
  });

  it("logs a single line on verbosity == 1", function() {
    var gotOutput = false;
    var logFun = function() { gotOutput = true; };
    var log = [];
    var oldLog = console.log;
    try {
      console.log = logFun;
      var opt = new Optimizer({
        matrices: easyMatrix,
        log: log.push.bind(log),
        verbosity: 1
      });
      var compressed = opt.bufferSync(png);
    } catch (e) {
      console.log = oldLog;
      throw e;
    }
    console.log = oldLog;
    gotOutput.should.be.false();
    log.length.should.equal(1);
  });

  it("logs multiple lines on verbosity == 2", function() {
    var gotOutput = false;
    var logFun = function() { gotOutput = true; };
    var log = [];
    var oldLog = console.log;
    try {
      console.log = logFun;
      var opt = new Optimizer({
        matrices: easyMatrix,
        log: log.push.bind(log),
        verbosity: 2
      });
      var compressed = opt.bufferSync(png);
    } catch (e) {
      console.log = oldLog;
      throw e;
    }
    console.log = oldLog;
    gotOutput.should.be.false();
    log.length.should.equal(4);
  });
});
