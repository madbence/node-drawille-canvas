module.exports = function (w, h) {
	var canvas = document.createElement('canvas');

	if (w != null) canvas.width = w;
	if (h != null) canvas.height = h;

	return canvas;
};
