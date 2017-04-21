const test = require('tape')
const stream = require('../')

test('create, push, and stream', t => {
  const s = stream.create(1)
  t.strictEqual(s(), 1)
  s(2)
  t.strictEqual(s(), 2)
  t.strictEqual(s(3), s)
  t.strictEqual(s(), 3)
  t.end()
})

test("map over a stream", t => {
  const s = stream.create()
  const mapped = stream.map(n => n + 1, s)
  s(1)
  t.strictEqual(mapped(), 2)
  s(2)
  t.strictEqual(mapped(), 3)
  t.end()
})

test("merge two streams", t => {
  const s1 = stream.create()
  const s2 = stream.create()
  const merged = stream.merge([s1, s2])
  s1(1)
  t.strictEqual(merged(), 1)
  s2(2)
  t.strictEqual(merged(), 2)
  s1(3)
  t.strictEqual(merged(), 3)
  t.end()
})

test("scan a stream", t => {
  const s = stream.create()
  const scanned = stream.scan((sum, n) => sum + n, 0, s)
  s(1)
  t.strictEqual(scanned(), 1)
  s(2)
  t.strictEqual(scanned(), 3)
  s(3)
  t.strictEqual(scanned(), 6)
  t.end()
})

test("buffer a stream", t => {
  const s = stream.create()
  const buffered = stream.buffer(2, s)
  s(1)
  t.strictEqual(buffered(), undefined)
  s(2)
  t.deepEqual(buffered(), [1,2])
  s(3)
  t.deepEqual(buffered(), [1,2])
  s(4)
  t.deepEqual(buffered(), [3,4])
  t.end()
})

test("filter a stream", t => {
  const s = stream.create()
  const filtered = stream.filter(n => n % 2 === 0, s)
  s(1)
  t.deepEqual(filtered(), undefined)
  s(2)
  t.deepEqual(filtered(), 2)
  s(3)
  t.deepEqual(filtered(), 2)
  s(4)
  t.deepEqual(filtered(), 4)
  t.end()
})

test("dependency graph", t => {
  const a = stream.create()
  const b = stream.map(n => n + 1, a)
  const c = stream.map(n => n + 2, a)
  const d = stream.merge([b, c])
  const e = stream.scan((accum, val) => accum.concat([val]), [], d)

  a(1)
  t.deepEqual(e(), [2, 3])
  a(2)
  t.deepEqual(e(), [2, 3, 3, 4])
  t.deepEqual(d(), 4)
  t.end()
})

test("weird example", t => {
  const s1 = stream.create()
  const s2 = stream.create()
  stream.map(s1, s2)
  stream.map(s1, stream.map(n => n * 2, s2))
  var arr = []
  stream.map(x => arr.push(x), s1)
  s2(1)
  t.deepEqual(arr, [1, 2])
  t.end()
})

test("debounce stream", t => {
  const s = stream.create()
  const d = stream.debounce(10, s)
  s(1); s(2); s(3); s(4); s(5)
  t.deepEqual(d(), undefined)
  setTimeout(() => {
    t.deepEqual(d(), 5)
    t.end()
  }, 10)
})

