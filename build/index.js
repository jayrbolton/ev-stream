var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var curryN = require('ramda/src/curryN');

// Create a new stream with an optional initial value
var create = function (val) {
  var data = { val: val, updaters: [] };
  var fn = function (val) {
    if (arguments.length === 0) return data.val;
    update(data, val);
    return fn;
  };
  fn.data = data; // cache for later
  fn.toString = function () {
    return 'stream(' + data.val + ')';
  };
  return fn;
};

// Update stream data and all dependents with a new val
var update = function (streamData, val) {
  streamData.val = val;
  for (var i = 0; i < streamData.updaters.length; ++i) {
    streamData.updaters[i](val);
  }
};

// Create a new stream with fn applied to all values within stream
var map = curryN(2, function (fn, stream) {
  var newS = create();
  stream.data.updaters.push(function (val) {
    return newS(fn(val));
  });
  return newS;
});

// Merge multiple streams into one, where each event on each streams fires separately in the result stream
var merge = function (streams) {
  var newS = create();
  for (var i = 0; i < streams.length; ++i) {
    streams[i].data.updaters.push(newS);
  }
  return newS;
};

// Scan all values in stream into a single rolling value
var scan = curryN(3, function (fn, accum, stream) {
  var newS = create(accum);
  stream.data.updaters.push(function (val) {
    accum = fn(accum, val);
    newS(accum);
  });
  return newS;
});

// Collect values from a stream into an array, and emit that array as soon as n values have been collected
var buffer = curryN(2, function (n, stream) {
  var newS = create();
  var buff = [];
  stream.data.updaters.push(function (val) {
    buff.push(val);
    if (buff.length === n) {
      newS(buff);
      buff = [];
    }
  });
  return newS;
});

// Filter values out of a stream using a predicate
var filter = curryN(2, function (fn, stream) {
  var newS = create();
  stream.data.updaters.push(function (val) {
    if (fn(val)) newS(val);
  });
  return newS;
});

// Scan and merge several streams into one, starting with an initial value
var scanMerge = curryN(2, function (streams, accum) {
  var newS = create(accum);

  var _loop = function () {
    var _streams$i = _slicedToArray(streams[i], 2),
        s = _streams$i[0],
        fn = _streams$i[1];

    s.data.updaters.push(function (val) {
      accum = fn(accum, val);
      newS(accum);
    });
  };

  for (var i = 0; i < streams.length; ++i) {
    _loop();
  }
  return newS;
});

// Create a stream that has val every time 'stream' emits anything
var always = curryN(2, function (val, stream) {
  return map(function () {
    return val;
  }, stream);
});

// Create a new stream whose immediate value is val
var defaultTo = curryN(2, function (val, stream) {
  var newS = create(val);
  stream.data.updaters.push(function (val) {
    return newS(val);
  });
  return newS;
});

// Log values on a stream for quick debugging
var log = function (stream, annotation) {
  stream.data.updaters.push(function (x) {
    return console.log(annotation || '', x);
  });
  return stream;
};

// Map over a stream, where fn returns a nested stream. Flatten into a single-level stream
var flatMap = curryN(2, function (fn, stream) {
  var newS = create(stream());
  stream.data.updaters.push(function (val) {
    return map(function (val) {
      return newS(val);
    }, fn(val));
  });
  return newS;
});

// -- Time-related
//

// Indefinetly emit a timestamp every ms until maxMs
var every = function (ms, maxMs) {
  var newS = create();
  var target = Number(new Date());
  var maxT = target + maxMs;
  function timer() {
    var now = Number(new Date());
    target += ms;
    newS(now);
    if (now < maxT) setTimeout(timer, target - now);
  }
  timer();
  return newS;
};

// Create a stream that emits values from 'stream' after a ms delay
var delay = function (ms, stream) {
  var newS = create();
  stream.data.updaters.push(function (val) {
    setTimeout(function () {
      return newS(val);
    }, ms);
  });
  return newS;
};

// Only emit values from a stream at most every ms
// After an ms delay when the first value is emitted from the source stream, the new stream then emits the _latest_ value from the source stream
var throttle = curryN(2, function (ms, stream) {
  var timeout;
  var newS = create();
  stream.data.updaters.push(function () {
    if (!timeout) {
      timeout = setTimeout(function () {
        timeout = null;
        newS(stream());
      }, ms);
    }
  });
  return newS;
});

// Create a stream that emits values from 'stream' after ms of silence
var afterSilence = function (ms, stream) {
  var newS = create();
  var timeout;
  stream.data.updaters.push(function (val) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(function () {
      return newS(stream());
    }, ms);
  });
  return newS;
};

module.exports = { create: create, map: map, merge: merge, scan: scan, buffer: buffer, filter: filter, scanMerge: scanMerge, defaultTo: defaultTo, always: always, flatMap: flatMap, delay: delay, every: every, throttle: throttle, afterSilence: afterSilence };

