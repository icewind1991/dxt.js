var SSIM = require('image-ssim');
var assert = require('assert');
var jpeg = require('jpeg-js');
var fs = require('fs');
var dxtJS = require('../src/dxt');

describe('Squish', function () {
    it('compressing and decompressing the image should return a image with >99% similarity', function () {
        const sourceData = loadImage(__dirname + '/input256.jpg');
        var compressed = dxtJS.compress(sourceData.data, sourceData.width, sourceData.height, dxtJS.flags.DXT5);
        var uncompressed = dxtJS.decompress(compressed, sourceData.width, sourceData.height, dxtJS.flags.DXT5);
        var resultData = {
            data: uncompressed,
            width: sourceData.width,
            height: sourceData.height,
            channels: sourceData.channels
        };
        var ssim = SSIM.compare(sourceData, resultData);
        assert(ssim.ssim > 0.99);
        assert(ssim.ssim < 1);
    });
});

function loadImage(file) {
    var jpegData = fs.readFileSync(file);
    var rawImageData = jpeg.decode(jpegData, true);
    rawImageData.channels = 4;
    return rawImageData;
}
