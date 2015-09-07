# jspngopt

**PNG optimizer, similar to OptiPNG**

[![npm version](https://img.shields.io/npm/v/jspngopt.svg)](https://www.npmjs.com/package/jspngopt)
[![Travis build status](https://api.travis-ci.org/gagern/jspngopt.svg?branch=master)](https://travis-ci.org/gagern/jspngopt)

`jspngopt` is a tool which tries to reduce the file size of a PNG file by

* removing the alpha channel of an opaque image
* converting a grayscale-only image to a grayscale color mode
* trying out different pixel prediction filters
* trying out different zlib compression parameter combinations

This is very similar to the [OptiPNG](http://optipng.sourceforge.net/) tool.
However, there is no shared code, and this implementation is written
*completely in JavaScript*. It will usually make use of the
[zlib bindings](https://nodejs.org/api/zlib.html) provided by node.js,
making use of the performance of native code there.
But it is also possible to use [pako](http://nodeca.github.io/pako/)
or similar libraries to provide a portable all-JavaScript setup.
Using a fixed version of pako on node.js will ensure reproducible results,
but may result in slightly larger files compared to the latest native zlib.

## Installation

On node.js, simply do

```sh
npm install jspngopt
```

A version which supports browserify is planned.
If you need things packaged for some other environment,
please file a ticket explaining your setup.

## Command-line usage

The command line interface of `jspngopt` is intended to be
mostly compatible with the one from `optipng`.
But as this project is in the early stages of development,
currently the only thing accepted on the command line is a list of file names,
which will be optimized with the default settings,
the results overwriting the input files if there was a size reduction.

## API

The central element of the API is the `Optimizer` object.

```js
var jspngopt = require("jspngopt");
var opt = new jspngopt.Optimizer();
var optimized = opt.bufferSync(unoptimized);
```

### Options

The `Optimizer` constructor takes an `options` dictionary.
It may contain the following elements:

* **matrices:** An array of objects, each of which describes a collection of
  possible compression parameters. The keys of each such objects are the same
  described below for parameters, while the values are arrays listing all the
  values which should be tried for a given parameter. The default corresponds
  to the default of `optipng`.
* **pako:** The `pako` module, as returned from `require("pako")`.
  Setting this option will use `pako` instead of `zlib`,
  ensuring reproducible results but possibly sacrificing performance
  and compression rate.
* **deflateSync:** A function which is functionally equivalent
  to `zlib.deflateSync` and which should be used in its stead.
* **maxIdatLength:** Maximal size of an `IDAT` chunk, defaults to `0x7fffffff`.
  This is the length of the raw data payload, excluding header and checksum.

### Parameters

Each parameter combination is described by the following numbers:

* **filters:** Which filters to try. Numbers 0 through 4 correspond to the
  filters *None* through *Paeth* described in the PNG specification.
  Filter 5 corresponds to an adaptive choice of filters which minimizes
  the sum of the absolute values in each row.
  Default: `[0, 5]`.
* **interlace:** 0 disables interlacing, while 1 will eventually enable
  Adam7 interlacing. Right now interlacing is not supported yet.
  Default: `[0]`.
* **windowBits:** Base-two logarithm of the size of the sliding window
  used to find redundant data.
  Valid values are in the range from 8 through 15.
  Default: `[15]`.
* **level:** Compression level, in the range from 0 (no compression)
  to 9 (best compression).
  Default: `[9]`.
* **memLevel:** Memory usage level, from 1 (little memory) to 9 (large memory).
  Default: `[8, 9]`.
* **strategy:** Compression strategy.
  * 0 is the `DEFAULT_STRATEGY` used for generic data.
  * 1 is `FILTERED`, optimized for the fact that numbers are likely small.
  * 2 is `HUFFMANN_ONLY` to not match duplicates at all.
  * 3 is `RLE`, performing only run-length encoding.
  * 4 is `FIXED` uses a fixed Huffmann coding table.

  Default: `[0, 1, 2, 3]`.

### Methods of Optimizer instances

#### bufferSync(Buffer) → Buffer

Takes the content of a complete PNG file as input,
and returns an optimized version on output.
Will throw an exception in case of an error.

#### fileSync(String) → void

Takes the name of a PNG file which will be read,
optimized and written to the same location.
Will throw an exception in case of an error.
This method is not available in the browserified version.
