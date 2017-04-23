const test = require('tape')
const stream = require('../')

test('create, push, and read', t => {
  const s = stream.create(1)
  t.strictEqual(s(), 1)
  s(2)
  t.strictEqual(s(), 2)
  t.strictEqual(s(3), s)
  t.strictEqual(s(), 3)
  t.end()
})

test("map", t => {
  const s = stream.create()
  const mapped = stream.map(n => n + 1, s)
  s(1)
  t.strictEqual(mapped(), 2)
  s(2)
  t.strictEqual(mapped(), 3)
  t.end()
})

test("merge", t => {
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

test("scan", t => {
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

test("buffer", t => {
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

test("filter", t => {
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

test("scanMerge", t => {
  const add = stream.create()
  const mul = stream.create()
  const result = stream.scanMerge([
    [add, (sum, n) => sum + n]
  , [mul, (sum, n) => sum * n]
  ], 0)

  add(1)
  t.deepEqual(result(), 1)
  mul(2)
  t.deepEqual(result(), 2)
  add(3)
  t.deepEqual(result(), 5)
  mul(4)
  t.deepEqual(result(), 20)
  t.end()
})

test("always", t => {
  const s = stream.create()
  const s1 = stream.always(1, s)
  s(9)
  t.deepEqual(s1(), 1)
  s(10)
  t.deepEqual(s1(), 1)
  t.end()
})

test("defaultTo", t => {
  const s = stream.create()
  const s1 = stream.defaultTo(1, s)
  t.deepEqual(s1(), 1)
  s(2)
  t.deepEqual(s1(), 2)
  t.end()
})

test("flatMap", t => {
  const s = stream.create()
  const sNested = stream.create()
  const s1 = stream.flatMap(v => sNested, s)
  s(1)
  t.deepEqual(s1(), undefined)
  sNested(1)
  t.deepEqual(s1(), 1)
  t.end()
})

test("every", t => {
  const e = stream.every(100, 200)
  const s = stream.scan((count, n) => count + 1, 0, e)
  setTimeout(() => {
    t.deepEqual(s(), 1)
  }, 101)
  setTimeout(() => {
    t.deepEqual(s(), 2)
    t.end()
  }, 201)
})

test("delay", t => {
  const s = stream.create()
  const d = stream.delay(10, s)
  s(1)
  t.deepEqual(d(), undefined)
  setTimeout(() => {
    t.deepEqual(d(), 1)
    s(2)
    t.deepEqual(d(), 1)
    setTimeout(() => {
      t.deepEqual(d(), 2)
      t.end()
    }, 10)
  }, 10)
})

test("throttle", t => {
  const s = stream.create()
  const d = stream.throttle(10, s)
  s(1); s(2)
  t.deepEqual(d(), undefined)
  setTimeout(() => {
    s(3)
  }, 5)
  setTimeout(() => {
    s(4)
    t.deepEqual(d(), 3)
    t.end()
  }, 10)
})

test("afterSilence", t => {
  const s = stream.create()
  const d = stream.afterSilence(10, s)
  s(1); s(2)
  t.deepEqual(d(), undefined)
  setTimeout(() => {
    s(3)
  }, 5)
  setTimeout(() => {
    t.deepEqual(d(), undefined)
  }, 11)
  setTimeout(() => {
    t.deepEqual(d(), 3)
    s(4)
    t.deepEqual(d(), 3)
    t.end()
  }, 20)
})

// -- Miscellaneous examples and edge cases

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

test("weird example from a flyd issue", t => {
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

