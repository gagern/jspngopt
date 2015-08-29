"use strict";

function none(w, n, nw) {
  return 0;
}

function sub(w, n, nw) {
  return w;
}

function up(w, n, nw) {
  return n;
}

function average(w, n, nw) {
  return (w + n) >> 1;
}

function paeth(w, n, nw) {
  var p = w + n - nw;
  var pw = Math.abs(p - w), pn = Math.abs(p - n), pnw = Math.abs(p - nw);
  return (pw <= pn && pw <= pnw) ? w : (pn <= pnw) ? n : nw;
}

var filters = [none, sub, up, average, paeth];

function getFilter(type) {
  if (type > filters.length)
    throw Error("Invalid filter type: " + type);
  return filters[type];
}

function unfilter(img) {
  var bpp = img.bytePerPixel;
  var bpl = img.bytePerLine;
  var filtered = img.filtered;
  var unfiltered = new Buffer(filtered.length);
  unfiltered.fill(0);
  var x, y, n, w, nw;
  var filter = getFilter(filtered[0]);
  for (x = 1; x < bpl; ++x) {
    w = (x <= bpp) ? 0 : unfiltered[x - bpp];
    unfiltered[x] = (filtered[x] + filter(w, 0, 0)) & 0xff;
  }
  for (y = 1; y < img.height; ++y) {
    var off = y*bpl, nOff = off - bpl, wOff = off - bpp, nwOff = nOff - bpp;
    filter = getFilter(filtered[off]);
    w = nw = 0;
    for (x = 1; x < bpl; ++x) {
      if (x > bpp) {
        w = unfiltered[wOff + x];
        nw = unfiltered[nwOff + x];
      }
      n = unfiltered[nOff + x];
      var i = off + x;
      unfiltered[i] = (filtered[i] + filter(w, n, nw)) & 0xff;
    }
  }
  return unfiltered;
}

function argmin(list) {
  var val = list[0];
  var arg = 0;
  for (var i = 1; i < list.length; ++i) {
    if (list[i] < val) {
      val = list[i];
      arg = i;
    }
  }
  return arg;
}

function filterAll(img) {
  var bpp = img.bytePerPixel;
  var bpl = img.bytePerLine;
  var unfiltered = img.unfiltered;
  var filtered = Array(6); // jshint ignore:line
  filtered[0] = unfiltered;
  var type;
  for (type = 1; type <= 5; ++type) {
    filtered[type] = new Buffer(unfiltered.length);
    for (var pos = 0; pos < unfiltered.length; pos += bpl)
      filtered[type][pos] = type;
  }
  var x, y, n, w, nw, p, v;
  var sums = [0, 0, 0, 0, 0];
  for (x = 1; x < bpl; ++x) {
    p = unfiltered[x];
    w = (x <= bpp) ? 0 : unfiltered[x - bpp];

    sums[0] += p;
    v = p - w;
    sums[1] += Math.abs(v);
    filtered[1][x] = v & 0xff;
    v = p;
    sums[2] += Math.abs(v);
    filtered[2][x] = v & 0xff;
    v = p - (w >> 1);
    sums[3] += Math.abs(v);
    filtered[3][x] = v & 0xff;
    v = p - paeth(w, 0, 0);
    sums[4] += Math.abs(v);
    filtered[4][x] = v & 0xff;
  }
  filtered[argmin(sums)].copy(filtered[5], 0, 0, bpl);
  for (y = 1; y < img.height; ++y) {
    var off = y*bpl, nOff = off - bpl, wOff = off - bpp, nwOff = nOff - bpp;
    w = nw = 0;
    for (x = 1; x < bpl; ++x) {
      if (x > bpp) {
        w = unfiltered[wOff + x];
        nw = unfiltered[nwOff + x];
      }
      n = unfiltered[nOff + x];
      var i = off + x;
      p = unfiltered[i];

      sums[0] += p;
      v = p - w;
      sums[1] += Math.abs(v);
      filtered[1][i] = v & 0xff;
      v = p - n;
      sums[2] += Math.abs(v);
      filtered[2][i] = v & 0xff;
      v = p - ((w + n) >> 1);
      sums[3] += Math.abs(v);
      filtered[3][i] = v & 0xff;
      v = p - paeth(w, n, nw);
      sums[4] += Math.abs(v);
      filtered[4][i] = v & 0xff;
    }
    filtered[argmin(sums)].copy(filtered[5], off, off, off + bpl);
  }
  return filtered;
}

module.exports = {
  filterAll: filterAll,
  unfilter: unfilter,
};
