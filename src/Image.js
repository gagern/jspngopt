"use strict";

var crc32 = require("buffer-crc32");

var filter = require("./filter");

function Image(hdr, chunks, filtered) {
  this.hdr = hdr;
  this.chunks = chunks;
  this.filtered = filtered;
  this.bpp = hdr.bitDepth >>> 3;
  var bpp = hdr.bitDepth * [1, 0, 3, 1, 2, 0, 4][hdr.colorType];
  this.bytePerPixel = ((bpp - 1) >>> 3) + 1;
  this.bytePerLine = ((hdr.width * bpp - 1) >>> 3) + 2;
  this.width = hdr.width;
  this.height = hdr.height;
  if (filtered.length != this.height * this.bytePerLine)
    throw Error("Expected " + this.height + " lines a " + this.bytePerLine +
                " bytes totalling " + this.height * this.bytePerLine +
                " but received " + filtered.length + " instead");
}

Image.prototype.unfilter = function() {
  this.unfiltered = filter.unfilter(this);
};

Image.prototype.filterAll = function() {
  this.refiltered = filter.filterAll(this);
};

Image.prototype.grayScale = function() {
  if ((this.hdr.colorType & 3) !== 2 || this.hdr.bitDepth !== 8)
    return this;
  var data = this.unfiltered;
  var bpp = this.bytePerPixel, bpl = this.bytePerLine, i = 0, j;
  var w = this.width, h = this.height, x, y;
  for (y = 0; y < h; ++y) {
    ++i; // filter type byte
    for (x = 0; x < w; ++x) {
      if (data[i] !== data[i + 1] || data[i] !== data[i + 2])
        return this;
      i += bpp;
    }
  }
  var bppg = bpp - 2, bplg = bppg * w + 1;
  var gray = new Buffer(bplg * h);
  i = 0;
  j = 0;
  for (y = 0; y < h; ++y) {
    gray[j++] = data[i++];
    for (x = 0; x < w; ++x) {
      gray[j++] = data[i];
      i += 3;
      if (bppg !== 1)
        gray[j++] = data[i++]; // alpha
    }
  }
  var hdr = this.hdr;
  hdr = {
    width: hdr.width,
    height: hdr.height,
    bitDepth: hdr.bitDepth,
    colorType: hdr.colorType ^ 2,
    compressionMethod: hdr.compressionMethod,
    filterMethod: hdr.filterMethod,
    interlaceMethod: hdr.interlaceMethod,
  };
  var img = new Image(hdr, this.chunks.slice(), gray);
  img.unfiltered = img.filtered;
  img.recreateIHDR();
  return img;
};

Image.prototype.opaque = function() {
  if ((this.hdr.colorType & 4) !== 4 || this.hdr.bitDepth !== 8)
    return this;
  var data = this.unfiltered;
  var bpp = this.bytePerPixel, bpl = this.bytePerLine, i = bpp, j;
  var w = this.width, h = this.height, x, y, c;
  for (y = 0; y < h; ++y) {
    for (x = 0; x < w; ++x) {
      if (data[i] !== 0xff)
        return this;
      i += bpp;
    }
    ++i; // filter type byte
  }
  var bppo = bpp - 1, bplo = bppo * w + 1;
  var opaq = new Buffer(bplo * h);
  i = 0;
  j = 0;
  for (y = 0; y < h; ++y) {
    opaq[j++] = data[i++];
    for (x = 0; x < w; ++x) {
      for (c = 0; c < bppo; ++c) {
        opaq[j++] = data[i++];
      }
      i++;
    }
  }
  var hdr = this.hdr;
  hdr = {
    width: hdr.width,
    height: hdr.height,
    bitDepth: hdr.bitDepth,
    colorType: hdr.colorType ^ 4,
    compressionMethod: hdr.compressionMethod,
    filterMethod: hdr.filterMethod,
    interlaceMethod: hdr.interlaceMethod,
  };
  var img = new Image(hdr, this.chunks.slice(), opaq);
  img.unfiltered = img.filtered;
  img.recreateIHDR();
  return img;
};

Image.prototype.recreateIHDR = function() {
  var chunk = new Buffer(12 + 13);
  chunk.writeUInt32BE(this.hdr.width, 8);
  chunk.writeUInt32BE(this.hdr.height, 12);
  chunk.writeUInt8(this.hdr.bitDepth, 16);
  chunk.writeUInt8(this.hdr.colorType, 17);
  chunk.writeUInt8(this.hdr.compressionMethod, 18);
  chunk.writeUInt8(this.hdr.filterMethod, 19);
  chunk.writeUInt8(this.hdr.interlaceMethod, 20);
  this.chunks[0] = { type: "IHDR", data: this.completeChunk("IHDR", chunk) };
};

Image.prototype.completeChunk = function(type, chunk) {
  chunk.writeUInt32BE(chunk.length - 12, 0);
  chunk.write(type, 4, 4);
  this.crc32(chunk.slice(4, chunk.length - 4)).copy(chunk, chunk.length - 4);
  return chunk;
};

Image.prototype.crc32 = crc32;

module.exports = Image;
