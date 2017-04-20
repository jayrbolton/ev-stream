const curryN = require('ramda/src/curryN')

// Create a new stream with an optional initial value
const create = val => {
  const data = {val, updaters: []}
  const fn = function(val) {
    if(arguments.length === 0) return data.val
    update(data, val)
    return fn
  }
  fn.data = data // cache for later
  return fn
}

// Update stream data and all dependents with a new val
const update = (streamData, val) => {
  streamData.val = val
  for(var i = 0; i < streamData.updaters.length; ++i) {
    streamData.updaters[i](val)
  }
}

// Create a new stream with fn applied to all values within stream
const map = curryN(2, (fn, stream) => {
  const newS = create()
  stream.data.updaters.push(val => newS(fn(val)))
  return newS
})

// Merge multiple streams into one, where each event on each streams fires separately in the result stream
const merge = streams => {
  const newS = create()
  for(var i = 0; i < streams.length; ++i) {
    streams[i].data.updaters.push(newS)
  }
  return newS
}

// Scan all values in stream into a single rolling value
const scan = curryN(3, (fn, accum, stream) => 
  map(val => (accum = fn(accum, val)), stream)
)

// Collect values from a stream into an array, and emit that array as soon as n values have been collected
const buffer = curryN(2, (n, stream) => {
  const newS = create()
  var buff = []
  stream.data.updaters.push(val => {
    buff.push(val)
    if(buff.length === n) {
      newS(buff)
      buff = []
    }
  })
  return newS
})

// Filter values out of a stream using a predicate
const filter = curryN(2, (fn, stream) => {
  const newS = create()
  stream.data.updaters.push(val => { if(fn(val)) newS(val) })
  return newS
})

module.exports = {create, map, merge, scan, buffer, filter}

