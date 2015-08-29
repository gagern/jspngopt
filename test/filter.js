"use strict";

var fs = require("fs");
var should = require("should");

var SyncParser = require("../src/SyncParser");

describe("filters", function() {
  it("should be reversible", function() {
    var path = require.resolve("vendor-icons/dist/64x64/nodejs.png");
    var png = fs.readFileSync(path);
    var parser = new SyncParser();
    var img = parser.parse(png);
    img.unfilter();
    img.filterAll();
    img.refiltered.should.be.an.Array().of.length(6);
    var original = img.unfiltered;
    for (var f = 0; f < img.refiltered.length; ++f) {
      img.filtered = img.refiltered[f];
      img.unfiltered = null;
      img.unfilter();
      img.unfiltered.equals(original).should.be.true();
    }
  });
});
