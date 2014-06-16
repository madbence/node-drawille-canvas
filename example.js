var Canvas = require('./');

var c = new Canvas(160, 160);

function draw() {
  var now = Date.now();
  c._canvas.clear();
  c.save();
  c.rotate(now/1000*360/5);
  c.translate(80, 80);
  c.fillRect(-10, -10, 20, 20);
  c.beginPath();
  c.moveTo(0,0);
  c.lineTo(20,0);
  for(var i = 0; i < 11; i++) {
    c.lineTo(Math.cos(Math.PI/20*i)*20, Math.sin(Math.PI/20*i)*20);
  }
  c.lineTo(0,0)
  c.stroke();
  c.restore();

  c.fillRect(10, 10, 20, 20);
  c.clearRect(15, 15, 10, 10);
  console.log(c._canvas.frame());
}

setInterval(draw, 1000/24);
