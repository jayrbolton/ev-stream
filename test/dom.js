var stream = require('../')
var snabbdom = require('snabbdom')
var patch = snabbdom.init([ require('snabbdom/modules/eventlisteners').default ])

var h = require('snabbdom/h').default

var Count = function() {
  var add$ = stream.create()
  var sum$ = stream.scan(function(sum, n) { return sum + n }, 0, add$)
  return {add$: add$, sum$: sum$}
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
var state = Count()
var state$ = stream.merge([state.add$]) // , state.sum$])
var vnode = patch(container, view(state))
stream.scan(function(vnode, x) { return patch(vnode, view(state)) }, vnode, state$)
stream.map(function(x) { console.log('PATCHING', x) }, state$)
