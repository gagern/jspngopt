"use strict";

var zlib = require("zlib");

var Parameters = require("./Parameters");
var SyncParser = require("./SyncParser");

function Optimizer(options) {
  this.options = options = options || {};

  if (options.pako) {
    var pako = options.pako;
    if (!options.deflateSync) {
      options.deflateSync = function(buf) {
        return Buffer(pako.deflate(new Uint8Array(buf))); // jshint ignore:line
      };
    }
  }

  this.matrices = options.matrices || [{
    filter: [0, 5],
    interlace: [0],
    windowBits: [15],
    level: [9],
    memLevel: [8, 9],
    strategy: [0, 1, 2, 3],
  }];

  this.reportSuffix = options.fileName ? " " + options.fileName : "";
}

var signature = new Buffer([137, 80, 78, 71, 13, 10, 26, 10]);

Optimizer.prototype.bufferSync = function(buf) {
  var parser = new SyncParser(this.options);
  var img = parser.parse(buf);
  img.unfilter();
  img = img.opaque().grayScale();
  img.filterAll();
  this.img = img;
  this.bestData = null;
  this.bestParam = null;
  this.minSize = Infinity;
  var paramSets = this.paramSets();
  paramSets.forEach(this.compressSync, this);
  var res = this.buildPNG();
  this.reportBest(this.bestParam, this.img.filtered.length, this.minSize);
  this.img = null;
  return res;
};

Optimizer.prototype.paramSets = function() {
  return Parameters.expand(this.matrices);
};

Optimizer.prototype.compressSync = function(param) {
  var opts = {
    windowBits: param.windowBits,
    level: param.level,
    memLevel: param.memLevel,
    strategy: param.strategy,
  };
  var data = this.img.refiltered[param.filter];
  var deflate = this.options.deflateSync || zlib.deflateSync;
  var compressed = deflate(data, opts);
  if (compressed.length < this.minSize) {
    this.minSize = compressed.length;
    this.bestData = compressed;
    this.bestParam = param;
  }
};

Optimizer.prototype.reportBest = function(param, inSize, outSize) {
  console.log(param + ": " + inSize + " - " + outSize + this.reportSuffix);
};

Optimizer.prototype.buildPNG = function() {
  var chunks = [signature];
  var bestData = this.bestData;
  for (var c = 0; c < this.img.chunks.length; ++c) {
    var chunk = this.img.chunks[c];
    if (chunk.type !== "IDAT") {
      chunks.push(chunk.data);
    } else if (bestData !== null) {
      var maxLength = this.options.maxIdatLength || 0x7fffffff;
      var start, end;
      for (start = 0; start < bestData.length; start = end) {
        end = Math.min(start + maxLength, bestData.length);
        chunks.push(this.buildIDAT(bestData.slice(start, end)));
      }
      bestData = null;
    }
  }
  return Buffer.concat(chunks);
};

Optimizer.prototype.buildIDAT = function(data) {
  var chunk = new Buffer(data.length + 12);
  data.copy(chunk, 8);
  return this.img.completeChunk("IDAT", chunk);
};

module.exports = Optimizer;
