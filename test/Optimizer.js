"use strict";

var fs = require("fs");
var pako = require("pako");
var should = require("should");
var crc32 = require("buffer-crc32");

var Optimizer = require("../src/Optimizer");

describe("Optimizer", function() {
  var path = require.resolve("vendor-icons/dist/64x64/nodejs.png");
  var png = fs.readFileSync(path);
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
});
