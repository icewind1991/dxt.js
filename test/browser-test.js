var dxtJS = require('../src/dxt');
var domready = require("domready");

function getImageData(image, width, height) {
	var c = document.createElement("canvas");
	var ctx = c.getContext("2d");
	width = width || image.width;
	height = height || image.height;
	c.width = width;
	c.height = height;
	ctx.drawImage(image, 0, 0);
	return ctx.getImageData(0, 0, width, height);
}

function dataToCanvas(canvas, sourceData, width, height) {
	canvas.width = width;
	canvas.height = height;
	var ctx = canvas.getContext("2d");
	var imgData = ctx.createImageData(width, height);
	imgData.data.set(sourceData);
	ctx.putImageData(imgData, 0, 0);
}

domready(function () {
	var inputImage = document.getElementById('source');
	var outputCanvas = document.getElementById('result');
	inputImage.onload = function () {
		var sourceData = getImageData(inputImage, 256, 256);
		var start = (new Date()).getTime();
		var compressed = dxtJS.compress(sourceData.data, 256, 256, dxtJS.flags.DXT5);
		var uncompressed = dxtJS.decompress(compressed, 256, 256, dxtJS.flags.DXT5);
		var end = (new Date()).getTime();
		console.log('decompress done');
		console.log('took ' + (end - start) + 'ms');
		dataToCanvas(outputCanvas, uncompressed, 256, 256);
	}
});
