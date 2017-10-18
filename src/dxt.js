var libSquish = require('./squish.js');

var GetStorageRequirements = libSquish.cwrap('GetStorageRequirements', 'number', ['number', 'number', 'number']);
var CompressImage = libSquish.cwrap('CompressImage', 'void', ['number', 'number', 'number', 'number', 'number']);
var DecompressImage = libSquish.cwrap('DecompressImage', 'void', ['number', 'number', 'number', 'number', 'number']);

/**
 * get an emscripten pointer to a typed array
 *
 * @param {Uint8Array} sourceData
 * @returns {int}
 */
function pointerFromData(sourceData) {
    var buf = libSquish._malloc(sourceData.length * 4);
    libSquish.HEAPU8.set(sourceData, buf);
    return buf;
}

/**
 *
 * @param pointer
 * @param size
 * @return {Uint8Array}
 */
function getDataFromPointer(pointer, size) {
    return new Uint8Array(libSquish.HEAPU8.buffer, pointer, size);
}

// export "raw" function for use by other emscripten projects
exports.GetStorageRequirements = GetStorageRequirements;
exports.CompressImage = CompressImage;
exports.DecompressImage = DecompressImage;

/**
 *
 * @param {Uint8Array} inputData
 * @param {int} width
 * @param {int} height
 * @param {int} flags
 * @return {Uint8Array}
 */
exports.compress = function (inputData, width, height, flags) {
    var source = pointerFromData(inputData);
    var targetSize = GetStorageRequirements(width, height, flags);
    var pointer = libSquish._malloc(targetSize);
    CompressImage(source, width, height, pointer, flags);
    var out = getDataFromPointer(pointer, targetSize);
    libSquish._free(source);
    libSquish._free(pointer);
    return out;
};

/**
 *
 * @param {Uint8Array} inputData
 * @param {int} width
 * @param {int} height
 * @param {int} flags
 * @return {Uint8Array}
 */
exports.decompress = function (inputData, width, height, flags) {
    var source = pointerFromData(inputData);
    var targetSize = width * height * 4;
    var pointer = libSquish._malloc(targetSize);
    DecompressImage(pointer, width, height, source, flags);
    var out =  getDataFromPointer(pointer, width * height * 4);
    libSquish._free(source);
    libSquish._free(pointer);
    return out;
};

exports.flags = {
    // Use DXT1 compression.
    DXT1                     : ( 1 << 0 ),
    // Use DXT3 compression.
    DXT3                     : ( 1 << 1 ),
    // Use DXT5 compression.
    DXT5                     : ( 1 << 2 ),
    // Use a very slow but very high quality colour compressor.
    ColourIterativeClusterFit: ( 1 << 8 ),
    //! Use a slow but high quality colour compressor (the default).
    ColourClusterFit         : ( 1 << 3 ),
    //! Use a fast but low quality colour compressor.
    ColourRangeFit           : ( 1 << 4 ),
    //! Use a perceptual metric for colour error (the default).
    ColourMetricPerceptual   : ( 1 << 5 ),
    //! Use a uniform metric for colour error.
    ColourMetricUniform      : ( 1 << 6 ),
    //! Weight the colour by alpha during cluster fit (disabled by default).
    WeightColourByAlpha      : ( 1 << 7 )
};
