# dxt.js

[![Build Status](https://travis-ci.org/icewind1991/dxt.js.svg?branch=master)](https://travis-ci.org/icewind1991/dxt.js)

DXT (de)compression in nodejs and the browser (using browserify).

## Usage

```js
var dxt = require('dxt-js');
var imageData = getRawRGBADataFromSomeWhere();
var compressedData = dxt.compress(imageData, 256, 256, dxt.flags.DXT5); // assumes 256x256 image
var uncompressedData = dxt.decompress(imageData, 256, 256, dxtJS.flags.DXT5);
```

Note that all methods work with `UInt8Array`'s so when using nodejs you'll have to conver them to and from node buffers.

## Credits

dxt.js is based on [libsquish](https://sourceforge.net/projects/libsquish/) compiled with [emscripten](https://github.com/kripken/emscripten) and wouldn't be possible without the hard work of the respective authors.
