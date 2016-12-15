"use strict";

function Parser() {
  this.chunks = [];
}

Parser.prototype.check = function() {
  if (this.chunks.length < 2)
    throw Error("Less than two chunks");
  if (this.chunks[0].type !== "IHDR")
    throw Error("File doesn't start with IHDR chunk");
  if (this.chunks[this.chunks.length - 1].type !== "IEND")
    throw Error("File does not end with IEND chunk");
};

Parser.prototype.chunk = function(buf) {
  var type = buf.toString("utf8", 4, 8);
  this.chunks.push({type: type, data: buf});
  var handler = this["handle_" + type];
  if (handler) handler.call(this, buf);
};

Parser.prototype.handle_IHDR = function(buf) {
  if (buf.length !== 12 + 13)
    throw Error("IHDR chunk should have 13 data bytes");
  var hdr = this.hdr = {
    width: buf.readUInt32BE(8),
    height: buf.readUInt32BE(12),
    bitDepth: buf.readUInt8(16),
    colorType: buf.readUInt8(17),
    compressionMethod: buf.readUInt8(18),
    filterMethod: buf.readUInt8(19),
    interlaceMethod: buf.readUInt8(20),
  };
  if ([1, 2, 4, 8, 16].indexOf(hdr.bitDepth) === -1)
    throw Error("Unsupported bit depth: " + hdr.bitDepth);
  if ([0, 2, 3, 4, 6].indexOf(hdr.colorType) === -1)
    throw Error("Unsupported color type: " + hdr.colorType);
  if ((hdr.colorType & 2) !== 0 && hdr.bitDepth < 8 && !(hdr.colorType===3 && hdr.bitDepth===1))
    throw Error("Multi-sample sub-byte images are disallowed (except pngquant monochrome)");
  if (hdr.colorType === 3 && hdr.bitDepth > 8)
    throw Error("Multi-byte palette images are disallowed");
  if (hdr.compressionMethod !== 0)
    throw Error("Unsupported compression method: " + hdr.compressionMethod);
  if (hdr.filterMethod !== 0)
    throw Error("Unsupported filter method: " + hdr.filterMethod);
  if (hdr.interlaceMethod !== 0)
    throw Error("Interlacing not supported yet.");
};

Parser.prototype.handle_IEND = function(buf) {
  if (buf.length !== 12)
    throw Error("IEND chunk should have 0 data bytes");
};

module.exports = Parser;
