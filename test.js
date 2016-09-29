var Canvas = require('./');

var canvas = new Canvas();
c = canvas.getContext('2d');
c.strokeStyle = 'white'
c.fillStyle = 'white'
c.arc(40, 40, 30, 12, 4, true);
c.fill()
console.log(c.toString());

