var Canvas = require('drawille');
var bresenham = require('bresenham');
var glMatrix = require('gl-matrix');
var mat2d = glMatrix.mat2d;
var vec2 = glMatrix.vec2;

function Context(width, height) {
  this._canvas = new Canvas(width, height);
  this._matrix = mat2d.create();
  this._stack = [];
  this._currentPath = [];
}

Object.defineProperties(Context.prototype, {
  width: {
    get: function () {
      return this._canvas.width;
    },
    set: function (width) {
      this._canvas.width = width;
    }
  },
  height: {
    get: function () {
      return this._canvas.height;
    },
    set: function (height) {
      this._canvas.height = height;
    }
  }
});

var methods = ['save', 'restore', 'scale', 'rotate', 'translate', 'transform', 'setTransform', 'resetTransform', 'createLinearGradient', 'createRadialGradient', 'createPattern', 'beginPath', 'fill', 'stroke', 'drawFocusIfNeeded', 'clip', 'isPointInPath', 'isPointInStroke', 'fillText', 'strokeText', 'measureText', 'drawImage', 'createImageData', 'getImageData', 'putImageData', 'getContextAttributes', 'setLineDash', 'getLineDash', 'setAlpha', 'setCompositeOperation', 'setLineWidth', 'setLineCap', 'setLineJoin', 'setMiterLimit', 'clearShadow', 'setStrokeColor', 'setFillColor', 'drawImageFromRect', 'setShadow', 'closePath', 'moveTo', 'lineTo', 'quadraticCurveTo', 'bezierCurveTo', 'arcTo', 'rect', 'arc', 'ellipse'];

methods.forEach(function(name) {
  Context.prototype[name] = function() {};
});

function br(p1, p2) {
  return bresenham(
    Math.floor(p1[0]),
    Math.floor(p1[1]),
    Math.floor(p2[0]),
    Math.floor(p2[1])
  );
}

function triangle(pa, pb, pc, f) {
  var a = br(pb, pc);
  var b = br(pa, pc);
  var c = br(pa, pb);
  var s = a.concat(b).concat(c).sort(function(a, b) {
    if(a.y == b.y) {
      return a.x - b.x;
    }
    return a.y-b.y;
  });
  for(var i = 0; i < s.length - 1; i++) {
    var cur = s[i];
    var nex = s[i+1];
    if(cur.y == nex.y) {
      for(var j = cur.x; j <= nex.x; j++) {
        f(j, cur.y);
      }
    } else {
      f(cur.x, cur.y);
    }
  }
}

Context.prototype.clearRect = function(x, y, w, h) {
  var fromX = Math.round(Math.max(x, 0)),
      fromY = Math.round(Math.max(y, 0)),
      toX = Math.round(Math.min(x + w, this.width)),
      toY = Math.round(Math.min(x + h, this.height)),
      stepX = toX > fromX ? 1 : -1,
      stepY = toY > fromY ? 1 : -1;

  for (var i = fromX; i != toX; i+= stepX){
    for (var j = fromY; j != toY; j+= stepY){
      this._canvas.unset(i, j);
    }
  }
};

Context.prototype.fillRect = function(x, y, w, h) {
  var fromX = Math.round(Math.max(x, 0)),
      fromY = Math.round(Math.max(y, 0)),
      toX = Math.round(Math.min(x + w, this.width)),
      toY = Math.round(Math.min(x + h, this.height)),
      stepX = toX > fromX ? 1 : -1,
      stepY = toY > fromY ? 1 : -1;

  for (var i = fromX; i != toX; i+= stepX){
    for (var j = fromY; j != toY; j+= stepY){
      this._canvas.set(i, j);
    }
  }
};

Context.prototype.strokeRect = function (x, y, w, h) {
  var fromX = Math.round(Math.max(x, 0)),
      fromY = Math.round(Math.max(y, 0)),
      toX = Math.round(Math.min(x + w, this.width)),
      toY = Math.round(Math.min(x + h, this.height));

  var set = this._canvas.set.bind(this._canvas);

  bresenham(fromX, fromY, toX, fromY, set);
  bresenham(toX, fromY, toX, toY, set);
  bresenham(toX, toY, fromX, toY, set);
  bresenham(fromX, toY, fromX, fromY, set);
};

Context.prototype.save = function save() {
  this._stack.push(mat2d.clone(mat2d.create(), this._matrix));
};

Context.prototype.restore = function restore() {
  var top = this._stack.pop();
  if(!top) return;
  this._matrix = top;
};

Context.prototype.translate = function translate(x, y) {
  mat2d.translate(this._matrix, this._matrix, vec2.fromValues(x, y));
};

Context.prototype.rotate = function rotate(a) {
  mat2d.rotate(this._matrix, this._matrix, a/180*Math.PI);
};

Context.prototype.scale = function scale(x, y) {
  mat2d.scale(this._matrix, this._matrix, vec2.fromValues(x, y));
};

Context.prototype.beginPath = function beginPath() {
  this._currentPath = [];
};

Context.prototype.closePath = function closePath() {
  this._currentPath.push({
    point: this._currentPath[0].point,
    stroke: false
  });
};

Context.prototype.stroke = function stroke() {
  var set = this._canvas.set.bind(this._canvas);
  for(var i = 0; i < this._currentPath.length - 1; i++) {
    var cur = this._currentPath[i];
    var nex = this._currentPath[i+1];
    if(nex.stroke) {
      bresenham(cur.point[0], cur.point[1], nex.point[0], nex.point[1], set);
    }
  }
};

function addPoint(m, p, x, y, s) {
  var v = vec2.transformMat2d(vec2.create(), vec2.fromValues(x, y), m);
  p.push({
    point: [Math.floor(v[0]), Math.floor(v[1])],
    stroke: s
  });
}

Context.prototype.moveTo = function moveTo(x, y) {
  addPoint(this._matrix, this._currentPath, x, y, false);
};

Context.prototype.lineTo = function lineTo(x, y) {
  addPoint(this._matrix, this._currentPath, x, y, true);
};

Context.prototype.getContext = function (str) {
  return this;
};

module.exports = Context;
