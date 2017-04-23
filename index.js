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
  fn.toString = () => `stream(${data.val})`
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
const scan = curryN(3, (fn, accum, stream) => {
  const newS = create(accum)
  stream.data.updaters.push(val => {
    accum = fn(accum, val)
    newS(accum)
  })
  return newS
})

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

// Scan and merge several streams into one, starting with an initial value
const scanMerge = curryN(2, (streams, accum) => {
  const newS = create(accum)
  for(var i = 0; i < streams.length; ++i) {
    const [s, fn] = streams[i]
    s.data.updaters.push(val => {
      accum = fn(accum, val)
      newS(accum)
    })
  }
  return newS
})

// Create a stream that has val every time 'stream' emits anything
const always = curryN(2, (val, stream) => map(() => val, stream))

// Create a new stream whose immediate value is val
const defaultTo = curryN(2, (val, stream) => {
  const newS = create(val)
  stream.data.updaters.push(val => newS(val))
  return newS
})

// Log values on a stream for quick debugging
const log = (stream, annotation) => {
  stream.data.updaters.push(x => console.log(annotation || '', x))
  return stream
}

// Map over a stream, where fn returns a nested stream. Flatten into a single-level stream
const flatMap = curryN(2, (fn, stream) => {
  const newS = create(stream())
  stream.data.updaters.push(val => map(val => newS(val), fn(val)))
  return newS
})

// -- Time-related
//

// Indefinetly emit a timestamp every ms until maxMs
const every = (ms, maxMs) => {
  const newS = create()
  var target = Number(new Date())
  const maxT = target + maxMs
  function timer() {
    const now = Number(new Date())
    target += ms
    newS(now)
    if(now < maxT) setTimeout(timer, target - now)
  }
  timer()
  return newS
}

// Create a stream that emits values from 'stream' after a ms delay
const delay = (ms, stream) => {
  const newS = create()
  stream.data.updaters.push(val => {
    setTimeout(() => newS(val), ms)
  })
  return newS
}

// Only emit values from a stream at most every ms
// After an ms delay when the first value is emitted from the source stream, the new stream then emits the _latest_ value from the source stream
const throttle = curryN(2, (ms, stream) => {
  var timeout
  const newS = create()
  stream.data.updaters.push(() => {
    if(!timeout) {
      timeout = setTimeout(() => {
        timeout = null
        newS(stream())
      }, ms)
    }
  })
  return newS
})

// Create a stream that emits values from 'stream' after ms of silence
const afterSilence = (ms, stream) => {
  const newS = create()
  var timeout
  stream.data.updaters.push(val => {
    if(timeout) clearTimeout(timeout)
    timeout = setTimeout(() => newS(stream()), ms)
  })
  return newS
}

module.exports = {create, map, merge, scan, buffer, filter, scanMerge, defaultTo, always, flatMap, delay, every, throttle, afterSilence}

