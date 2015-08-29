"use strict";

var util = require("util");
var zlib = require("zlib");

var Image = require("./Image");
var Parser = require("./Parser");

function SyncParser() {
  Parser.call(this);
}

util.inherits(SyncParser, Parser);

SyncParser.prototype.parse = function(buf) {
  this.chunks = [];
  this.idat = [];
  if (buf.length < 57)
    throw Error("Too short to be a PNG file");
  if (buf.readUInt32BE(0) !== 0x89504e47 || buf.readUInt32BE(4) !== 0x0d0a1a0a)
    throw Error("PNG signature missing");
  var pos = 8;
  while (pos < buf.length) {
    if (pos + 12 > buf.length)
      throw Error("Incomplete chunk at offset 0x" + pos.toString(16));
    var len = buf.readUInt32BE(pos);
    if (len >= 0x80000000)
      throw Error("Chunk too long");
    var end = pos + 12 + len;
    if (end > buf.length)
      throw Error("Incomplete chunk at offset 0x" + pos.toString(16));
    this.chunk(buf.slice(pos, end));
    pos = end;
  }
  this.check();
  if (this.idat.length === 0)
    throw Error("File does not contain any IDAT chunks");
  var idat = Buffer.concat(this.idat);
  idat = this.inflate(idat);
  var img = new Image(this.hdr, this.chunks, idat);
  this.chunks = this.idat = null; // free for easier garbage collection
  return img;
};

SyncParser.prototype.handle_IDAT = function(buf) {
  this.idat.push(buf.slice(8, buf.length - 4));
};

SyncParser.prototype.inflate = zlib.inflateSync;

module.exports = SyncParser;
