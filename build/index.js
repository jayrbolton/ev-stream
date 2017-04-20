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
  return fn;
};

// Update stream data and all dependents with a new val
var update = function (streamData, val, ts) {
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
  return map(function (val) {
    return accum = fn(accum, val);
  }, stream);
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

module.exports = { create: create, map: map, merge: merge, scan: scan, buffer: buffer, filter: filter };

