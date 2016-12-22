"use strict";

var fs = require("fs");
var should = require("should");

var SyncParser = require("../src/SyncParser");

describe("filters", function() {

  function reversible(name) {
    var path = require.resolve(name);
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
  }

  it("should be reversible on true color image",
     reversible.bind(null, "./test1.png"));

});
