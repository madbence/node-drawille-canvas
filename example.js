var Canvas = require('./');

var n = 20;
var a = 50;
var w = 80;
var t = 2;
var pi = Math.PI;
var pi2 = pi/2;
var sin = Math.sin;
var cos = Math.cos;

var c = new Canvas(w*2, w*2);

function draw() {
  var now = Date.now()/1000;
  c._canvas.clear();
  c.save();
  c.translate(w, w);
  for(var i = 1; i < n; i++) {
    var r = i*(w/n);
    c.beginPath();
    c.moveTo(-r, 0);
    var tt = now*pi/t;
    var p = (sin(tt-pi*(cos(pi*i/n)+1)/2)+1)*pi2;
    for(var j = 0; j < a; j++) {
      var ca = pi*j/(a-i);
      if(p > ca) {
        c.lineTo(-cos(ca)*r, -sin(ca)*r);
      } else {
        c.lineTo(-cos(p)*r, -sin(p)*r);
      }
    }
    c.stroke();
  }
  c.restore();
  console.log(c._canvas.frame());
}

setInterval(draw, 1000/24);
