
// Create a new stream with an optional initial value
const create = val => {
  const streamData = {val, updaters: []}
  const streamFunc = val => {
    if(val !== undefined) {
      update(streamData, val)
      return streamFunc
    } else return streamData.val
  }
  streamFunc.data = streamData // cache for later
  streamFunc.toString = () => `stream(${streamData.val})`
  return streamFunc
}

// Update stream data and all dependents with a new val
const update = (streamData, val) => {
  streamData.val = val
  for(const i = 0; i < streamData.updaters.length; ++i) {
    streamData.updaters[i](val)
  }
}

// Create a new stream with fn applied to all values within stream
const map = (fn, stream) => {
  const newS = create()
  stream.data.updaters.push(newS)
  return newS
}

// Merge multiple streams into one, where each event on each streams fires separately in the result stream
const merge = (streams) => {
  const newS = create()
  for(const i = 0; i < streams.length; ++i) {
    streams[i].data.updaters.push(newS)
  }
  return newS
}

// Scan all values in stream into a single rolling value
const scan = (fn, accum, stream) => 
  map(val => (accum = fn(accum, val)), stream)

// Collect values from a stream into an array, and emit that array as soon as n values have been collected
const buffer = (n, stream) => {
  const newS = create(initialValue)
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

