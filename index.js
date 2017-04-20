// Create a new stream with an optional initial value
const create = val => {
  const streamData = {val, updaters: []}
  const streamFunc = function(val) {
    if(arguments.length === 0) return streamData.val
    update(streamData, val, Number(new Date()))
    return streamFunc
  }
  streamFunc.data = streamData // cache for later
  streamFunc.toString = () => `stream(${streamData.val})`
  return streamFunc
}

// Update stream data and all dependents with a new val
const update = (streamData, val, ts) => {
  streamData.val = val
  for(var i = 0; i < streamData.updaters.length; ++i) {
    streamData.updaters[i](val)
  }
}

// Create a new stream with fn applied to all values within stream
const map = (fn, stream) => {
  const newS = create()
  stream.data.updaters.push(val => newS(fn(val)))
  return newS
}

// Merge multiple streams into one, where each event on each streams fires separately in the result stream
const merge = (streams) => {
  const newS = create()
  for(var i = 0; i < streams.length; ++i) {
    streams[i].data.updaters.push(newS)
  }
  return newS
}

// Scan all values in stream into a single rolling value
const scan = (fn, accum, stream) => 
  map(val => (accum = fn(accum, val)), stream)

// Collect values from a stream into an array, and emit that array as soon as n values have been collected
const buffer = (n, stream) => {
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
}

// Filter values out of a stream using a predicate
const filter = (fn, stream) => {
  const newS = create()
  stream.data.updaters.push(val => { if(fn(val)) newS(val) })
  return newS
}

module.exports = {create, map, merge, scan, buffer, filter}

