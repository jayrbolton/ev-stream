
# event-stream

Simple & tiny implementation of FRP event streams in JS, heavily inspired by [flyd](https://github.com/paldepind/flyd), but without atomic updates. This type of data structure is often known as an "observable."

* very tiny, simple, and minimal implementation (less than 200 SLOC)
* eager, non-lazy evaluation
* catered towards web development

# API

## create(val)

Create a new event stream with an optional initial value. Push to the stream by calling it as a function with a value. Read from the stream by calling it with no arguments.

```js
const s = stream.create()
s() // -> undefined, no value in the stream yet
s(1) // push a value to the stream
s() // -> 1
s(2) // push another value
s() // -> 2
```

### A note about pushing values

**In practical use, you will not want to manually push values into streams, as shown above**. Manual pushing is provided mostly for convenience, and for illustrative purposes. In your applications, you will want to avoid pushing values to streams, as that will become messy. **Instead, focus on using the following set of higher-order functions to create new streams from existing ones:**

## map(fn, stream)

Create a stream where each value is `fn` applied to each value from a source stream.

```
s:                {--1--2--3--}
map(n => n*2, s): {--2--4--6--}
```

```js
const s = stream.create()
const mapped = stream.map(n => n + 1, s)
s(1)
mapped() // -> 2
s(2)
mapped() // -> 3
```

## merge([stream1, stream2, ...])

Create a stream that emits values from any of the source streams.

```
s1:              {--a--b--c--}
s2:              {-d--e-----f}
merge([s1, s2]): {-da-eb--c-f}
```

```js
const s1 = stream.create()
const s2 = stream.create()
const merged = stream.merge([s1, s2])
s1(1)
merged() // -> 1
s2(2)
merged() // -> 2
s1(3)
merged() // -> 3
```

## scan(fn, accum, stream)

Create a stream whose values are the result of applying `fn` to a starting value and every value from a source stream. Similar to `reduce` for arrays.

```
s:                             {--1--2--3--}
scan((sum, n) => sum+n, 0, s): {--1--3--6--}
```

```js
const s = stream.create()
const scanned = stream.scan((sum, n) => sum + n, 0, s)
s(1)
scanned() // -> 1
s(2)
scanned() // -> 3
s(3)
scanned() // -> 6
```

## buffer(n, stream)

Collect values from stream into a buffer array until the array reaches length `n`. Once it reaches length `n`, then emit that array into a stream.

```
s:            {---1-2--3--4---}
buffer(2, s): {-----▼-----▼---}
                    [1,2] [3,4]
```


```js
const s = stream.create()
const b = buffer(2, s)
s(1)
b() // -> undefined
s(2)
b() // -> [1,2]
s(3)
b() // -> [1,2]
s(4)
b() // -> [3,4]
```

## filter(fn, stream)

Create a stream that only emits values from a source stream when `fn` is true when applied to the value from the source stream.

```js
const s = stream.create()
const f = filter(n => n % 2 === 0, s)
s(1)
f() // -> undefined (f does not emit)
s(2)
f() // -> 2 (f emits 2)
s(3)
f() // -> 2 (f remains unchanged, does not emit)
s(4)
f() // -> 4 (f emits 4)
```

## always(val, stream)

Create a stream that always emits `val` whenever anything is emitted from the source stream.

```
s:                {--a--b--c--}
defaultTo(z, s):  {--z--z--z--}
```

```js
const s = stream.create()
const a = stream.always(1, s)
s(99)
a() // -> 1
s(100)
a() // -> 1
s(101)
a() // -> 1
// Every time s emits anything, a will emit 1
```

## defaultTo(val, stream)

Create a stream with all the same values from the source stream, but whose immediate, default value is `val`. This is equivalent to: `map(x => val, stream)`

```
s:                {--a--b--c--}
defaultTo(z, s):  {z-a--b--c--}
```

```js
const s = stream.create()
const d = stream.defaultTo('hi!', s)
d() // -> 'hi!'
s(1)
d() // -> 1
```

## log(stream, [annotation])

Log values from a stream for quick debugging (optionally pass in an annotation String so you know which stream you are logging). This function is not curried.

```js
const s = stream.create()
log(s, 's')
s(1)
// console prints: "s 1"
```

## scanMerge(streams, initialVal)

Scan and combine multiple streams into a single stream using an initial value. This one is very handy for combining multiple event streams into a single UI state.

```js
const add = stream.create()
const mul = stream.create()
const result = stream.scanMerge([
  [add, (sum, n) => sum + n]
, [mul, (sum, n) => sum * n]
], 0)

add(1)
result() // -> 1
mul(2)
result() // -> 2
add(3)
result() // -> 5
mul(4)
result() // -> 20
```

# Time-related

## every(ms, maxMS)

Create a new stream that emits a timestamp every `ms` until we've been running for `maxMS`

```
(each hyphen represents 10ms)

every(10, 40):    {-t-t-t-t----}
```

```js
const e = stream.every(10, 40)
const count = stream.scan(c => c + 1, 0, e)

setTimeout(() => {
  count() // -> 1
}, 10)

setTimeout(() => {
  count() // -> 2
}, 20)

//etc. up to 40ms
```

## throttle(ms, stream)

Create a stream that only emits values from a source stream at most every `ms`

```
(each hyphen represents 10ms)

s:               {-abc--defg--h--ij--}
throttle(20, s): {---c----f--g--h--j-}
```

```js
const s = stream.create()
const d = throttle(10, s)
s(1)
s(2)
s(3)
s(4)
s(5)
d() // -> undefined
setTimeout(()=> {
  d() // -> 5
}, 10)
```

In the above example, a 10ms timer is started at `s(1)`, and the value 5 is emitted from `d` when the timer is finished.

## afterSilence(ms, stream)

Create a stream that emits values after `ms` of silence from the source stream.

```
(each hyphen represents 10ms)

s:                    {--abc--d---ef---}
afterSilence(10,s):   {------c--d----f-}
```

```js
```

## delay(ms, stream)

Create a stream that emits every value from a source stream after an `ms` delay

```
(each hyphen represents 10ms)

s:            {---a---b---c----}
delay(20, s): {-----a---b---c--}
```

```js
const s = create()
const d = delay(10, s)
s(1)
d() // -> undefined

// Wait 10ms
setTimeout(()=> {
  d() // -> 1
  s(2)
  d() // -> 1
}, 10)

// Wait 20ms
setTimeout(()=> {
  d() // -> 2
}, 20)
```

### "afterSilence" versus "throttle" versus "delay"

The difference between these functions can be confusing, but they each serve their own purpose.

```
(each hyphen represents 10ms)

s:                     {--abc-de---}
throttle(20, s):       {----c---e--}
afterSilence(20, s):   {---------e-}
delay(20, s):          {----abc-de-}
```

In `throttle`, a timer of 20ms starts when `a` first emits. 20ms later, the most recent value gets emitted, which is `c`. Another timer starts at `d`, which causes `e` to get emitted another 20ms later.

In `afterSilence`, a timer of 20ms starts after each emitted value, but then is reset if another value is emitted. The 20ms timers that start after `a`, `b`, `c`, and `d` all get cancelled out by values that get emitted less than 20ms after. Finally, the 20ms timer that starts when `e` is emitted never gets cancelled out, so `e` is emitted after 20ms of silence.

In `delay`, every value from the source stream is always emitted, but after a delay for each value. A timer is started for every value on the source stream, and the value is emitted 20ms later in the new stream.
