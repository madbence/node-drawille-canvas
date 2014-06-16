var Canvas = require('./');

var c = new Canvas(160, 160);

function draw() {
  var now = Date.now();
  c._canvas.clear();
  c.save();
  c.rotate(now/1000*360/5);
  c.translate(80, 80);
  c.fillRect(-10, -10, 20, 20);
  c.restore();
  console.log(c._canvas.frame());
}

setInterval(draw, 1000/24);
