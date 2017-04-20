
# event-stream

Simple & tiny implementation of FRP event streams in JS, heavily inspired by [flyd](https://github.com/paldepind/flyd), but without atomic updates.

# Basic API

## create(val)

Create a new event stream with an optional initial value. Push to the stream by calling it as a function with a value. Read from the stream by calling it with no arguments.

```js
const s = stream.create()
s() // -> undefined
s(1)
s() // -> 1
```

## map(fn, stream)

Create a stream where each value is `fn` applied to each value from a source stream.

```js
const s = stream.create()
const mapped = stream.map(n => n + 1, s)
s(1)
mapped() // -> 2
s(2)
mapped() // -> 3
```

## merge([stream1, stream2, ...])

Create a stream that emits a value for any value from any of the source streams.

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
t.end()
```

## scan(fn, accum, stream)

Create a stream whose values are the result of applying `fn` to a starting value and every value from a source stream. Similar to `reduce` for arrays.

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
f() // -> undefined
s(2)
f() // -> 2
s(3)
f() // -> undefined
s(4)
f() // -> 4
```
