var Canvas = require('./');

var c = new Canvas(160, 160);

c.fillRect(10, 10, 40, 40);
c.clearRect(15, 15, 30, 25);

console.log(c.canvas.frame());
