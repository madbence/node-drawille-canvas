var Canvas = require('drawille');
var bresenham = require('bresenham');
var glMatrix = require('gl-matrix');
var earcut = require('earcut');
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

var methods = ['save', 'restore', 'scale', 'rotate', 'translate', 'transform', 'setTransform', 'resetTransform', 'createLinearGradient', 'createRadialGradient', 'createPattern', 'beginPath', 'fill', 'stroke', 'drawFocusIfNeeded', 'clip', 'isPointInPath', 'isPointInStroke', 'strokeText', 'measureText', 'drawImage', 'createImageData', 'getContextAttributes', 'setLineDash', 'getLineDash', 'setAlpha', 'setCompositeOperation', 'setLineWidth', 'setLineCap', 'setLineJoin', 'setMiterLimit', 'clearShadow', 'setStrokeColor', 'setFillColor', 'drawImageFromRect', 'setShadow', 'closePath', 'moveTo', 'lineTo', 'quadraticCurveTo', 'bezierCurveTo', 'arcTo', 'rect', 'arc', 'ellipse'];

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

function triangle(pa, pb, pc, f, clip) {
  var a = br(pb, pc);
  var b = br(pa, pc);
  var c = br(pa, pb);

  var s = a.concat(b).concat(c)
  //blow away y’s outside of the clipping area
  .filter(function(point) {
    return point.y < clip[3] && point.y > clip[1];
  })
  .sort(function(a, b) {
    if(a.y == b.y) {
      return a.x - b.x;
    }
    return a.y-b.y;
  })

  for(var i = 0; i < s.length - 1; i++) {
    var cur = s[i];
    var nex = s[i+1];
    //clamp x line by the clip area
    var left = Math.max(clip[0], cur.x);
    var right = Math.min(clip[2], nex.x);
    if(cur.y == nex.y) {
      for(var j = left; j <= right; j++) {
        f(j, cur.y);
      }
    } else {
      f(cur.x, cur.y);
    }
  }
}


function quad(m, x, y, w, h, f, clip) {
  var p1 = vec2.transformMat2d(vec2.create(), vec2.fromValues(x, y), m);
  var p2 = vec2.transformMat2d(vec2.create(), vec2.fromValues(x+w, y), m);
  var p3 = vec2.transformMat2d(vec2.create(), vec2.fromValues(x, y+h), m);
  var p4 = vec2.transformMat2d(vec2.create(), vec2.fromValues(x+w, y+h), m);
  triangle(p1, p2, p3, f, clip);
  triangle(p3, p2, p4, f, clip);
}

Context.prototype.clearRect = function(x, y, w, h) {
  quad(this._matrix, x, y, w, h, this._canvas.unset.bind(this._canvas), [0, 0, this.width, this.height]);
};

Context.prototype.fillRect = function(x, y, w, h) {
  quad(this._matrix, x, y, w, h, this._canvas.set.bind(this._canvas), [0, 0, this.width, this.height]);
};

Context.prototype.fill = function() {
  if (this._currentPath[this._currentPath.length-1].point !== this._currentPath[0].point) this.closePath();
  var vertices = [];
  this._currentPath.forEach(function (pt) { 
    vertices.push(pt.point[0], pt.point[1]);
  });
  var triangleIndices = earcut(vertices);
  var p1, p2, p3;
  for (var i = 0; i < triangleIndices.length; i = i + 3) {
    p1 = [vertices[triangleIndices[i] * 2], vertices[triangleIndices[i] * 2 + 1]];
    p2 = [vertices[triangleIndices[i + 1] * 2], vertices[triangleIndices[i + 1] * 2 + 1]];
    p3 = [vertices[triangleIndices[i + 2] * 2], vertices[triangleIndices[i + 2] * 2 + 1]];
    triangle(p1, p2, p3, this._canvas.set.bind(this._canvas), [0, 0, this.width, this.height]);
  }
};

Context.prototype.strokeRect = function (x, y, w, h) {
  var fromX = clamp(x, 0, this.width),
      fromY = clamp(y, 0, this.height),
      toX = clamp(x + w, 0, this.width),
      toY = clamp(y + h, 0, this.height);

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

Context.prototype.moveTo = function moveTo(x, y) {
  addPoint(this._matrix, this._currentPath, x, y, false);
};

Context.prototype.lineTo = function lineTo(x, y) {
  addPoint(this._matrix, this._currentPath, x, y, true);
};

Context.prototype.arc = function arc(h, k, r, th1, th2, anticlockwise) {
  var x, y;
  var dth = Math.abs(Math.acos(1 / r) - Math.acos(2 / r))
  if (anticlockwise) {
    var tempth = th2;
    th2 = th1 + 2 * Math.PI;  
    th1 = tempth;
  }
  th1 = th1 % (2 * Math.PI)
  if (th2<th1) th2 = th2 + 2 * Math.PI;
  for (var th = th1; th <= th2; th = th + dth) {
    y = clamp(r * Math.sin(th) + k, 0, this.height)
    x = clamp(r * Math.cos(th) + h, 0, this.width)
    addPoint(this._matrix, this._currentPath, x, y, true);
  }
};

Context.prototype.fillText = function (text, x, y, maxWidth) {

};

Context.prototype.getContext = function (str) {
  return this;
};

Context.prototype.toString = function () {
  var frame = this._canvas.frame();

  return frame;
};

Context.prototype.getImageData = function (sx, sy, sw, sh) {
  if (sx == null) sx = 0;
  if (sy == null) sy = 0;
  if (sw == null) sw = this.width;
  if (sh == null) sh = this.height;

  var result = {
    data: [],
    width: sw,
    height:sh
  };

  sx = Math.floor(sx/2);
  sw = Math.floor(sw/2);
  sy = Math.floor(sy/4);
  sh = Math.floor(sh/4);

  var delimiter = '\n';

  var data = this.toString().split(delimiter);

  for (var i = 0; i < sh; i++) {
    result.data.push(data[sy + i].slice(sx, sx + sw));
  }

  result.data = result.data.join(delimiter)

  return result;
};

Context.prototype.putImageData = function (imageData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
  var delimiter = '\n';
  var data = imageData.data.split(delimiter);
  var height = imageData.height;
  var width = imageData.width;
  dirtyX = dirtyX || 0;
  dirtyY = dirtyY || 0;
  dirtyWidth = dirtyWidth !== undefined? dirtyWidth: width;
  dirtyHeight = dirtyHeight !== undefined? dirtyHeight: height;

  dirtyX = Math.floor(dirtyX/2);
  dirtyY = Math.floor(dirtyY/4);
  width = Math.floor(width/2);
  height = Math.floor(height/4);
  dirtyWidth = Math.floor(dirtyWidth/2);
  dirtyHeight = Math.floor(dirtyHeight/4);

  var limitBottom = dirtyY + dirtyHeight;
  var limitRight = dirtyX + dirtyWidth;
  for (var y = dirtyY; y < limitBottom; y++) {
    for (var x = dirtyX; x < limitRight; x++) {
      if (data[y][x] !== ' ') {
        this.fillRect(x + dx, y + dy, 1, 1);
      }
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

function clamp (value, min, max) {
  return Math.round(Math.min(Math.max(value, min), max));
};


module.exports = Context;
