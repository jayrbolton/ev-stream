var stream = require('../')
var snabbdom = require('snabbdom')
var patch = snabbdom.init([ require('snabbdom/modules/eventlisteners').default ])

var h = require('snabbdom/h').default

var Count = function() {
  var add$ = stream.create()
  var sum$ = stream.scan(function(sum, n) { return sum + n }, 0, add$)
  var a$ = stream.map(n => n * 2, sum$)
  var b$ = stream.map(n => n / 2, sum$)
  return {sum$: sum$, add$: add$, a$: a$, b$: b$}
}

var view = function(count) {
  return h('div', [
    h('p', ['Sum is ', count.sum$()])
  , h('button', {on: {click: [count.add$, 1]}}, 'Increment')
  , h('button', {on: {click: [count.add$, -1]}}, 'Decrement')
  , h('button', {on: {click: [count.add$, -count.sum$()]}}, 'Reset')
  ])
}


// -- Render!

var container = document.createElement('div')
document.body.appendChild(container)
var actionData = {}
var count = Count()
var vnode = patch(container, view(count))
var update$ = stream.map(() => Number(new Date()), stream.merge([count.add$, count.sum$, count.a$, count.b$]))
update$ = stream.debounce(10, update$)
stream.scan(function(vnode, x) { return patch(vnode, view(count)) }, vnode, update$)
stream.map(ts => console.log("PATCHING", ts), update$)
