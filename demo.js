;(function () {
;(function () {

function h() {
  var args = [].slice.call(arguments), e = null
  function item (l) {
    var r
    function parseClass (string) {
      var m = string.split(/([\.#]?[a-zA-Z0-9_-]+)/)
      m.forEach(function (v) {
        var s = v.substring(1,v.length)
        if(!v) return 
        if(!e)
          e = document.createElement(v)
        else if (v[0] === '.')
          e.classList.add(s)
        else if (v[0] === '#')
          e.setAttribute('id', s)
      })
    }

    if(l == null)
      ;
    else if('string' === typeof l) {
      if(!e)
        parseClass(l)
      else
        e.appendChild(r = document.createTextNode(l))
    }
    else if('number' === typeof l 
      || 'boolean' === typeof l
      || l instanceof Date 
      || l instanceof RegExp ) {
        e.appendChild(r = document.createTextNode(l.toString()))
    }
    //there might be a better way to handle this...
    else if (Array.isArray(l))
      l.forEach(item)
    else if(l instanceof Node)
      e.appendChild(r = l)
    else if(l instanceof Text)
      e.appendChild(r = l)
    else if ('object' === typeof l) {
      for (var k in l) {
        if('function' === typeof l[k]) {
          if(/^on\w+/.test(k)) {
            e.addEventListener(k, l[k])
          } else {
            e[k] = l[k]()
            l[k](function (v) {
              e[k] = v
            })
          }
        }
        else if(k === 'style') {
          for (var s in l[k]) (function(s, v) {
            if('function' === typeof v) {
              e.style.setProperty(s, v())
              v(function (val) {
                e.style.setProperty(s, val)
              })
            } else
              e.style.setProperty(s, l[k][s])
          })(s, l[k][s])
        } else
          e[k] = l[k]
      }
    } else if ('function' === typeof l) {
      //assume it's an observable!
      var v = l()
      e.appendChild(r = v instanceof Node ? v : document.createTextNode(v))

      l(function (v) {
        if(v instanceof Node && r.parentElement)
          r.parentElement.replaceChild(v, r), r = v
        else
          r.textContent = v
      })
      
    }

    return r
  }
  while(args.length)
    item(args.shift())

  return e
}

if(typeof module === 'object')
 module.exports = h
else
  this.hyperscript = h
})()
;(function () {

//---util-funtions------

function all(ary, val) {
  for(var k in ary)
    ary[k](val)
}

function remove(ary, item) {
  delete ary[ary.indexOf(item)]  
}

/*
##value
An observable that stores a value.
*/

function value () {
  var _val, listeners = []
  return function (val) {
    return (
      get(val) ? _val
    : set(val) ? all(listeners, _val = val)
    : (listeners.push(val), function () {
        remove(listeners, val)
      })
  )}}

/*
##property
observe a property of an object, works with scuttlebutt.
could change this to work with backbone Model - but it would become ugly.
*/

function get(val) {
  //void(0) is a trick to get a true undefined value, even if user has overwrit
  return undefined === val
}

/*
### set(val) _(private)_
return true if this call is a set (a non function is supplied)
set(val) assumes you have already checked get(val)
if the call is neither a get or a set, a function is passed, it's a listen.
*/

function set(val) {
  return 'function' !== typeof val
}

/*
now, lets rewrite our first example
*/

function property (model, key) {
  return function (val) {
    return (
      get(val) ? model.get(key) :
      set(val) ? model.set(key, val) :
      (model.on('change:'+key, val), function () {
        model.removeListener('change:'+key, val)
      })
    )}}
    //^ if written in this style, always ends )}}

/*
note the use of the elvis operator `?:` in chained else-if formation,
and also the comma operator `,` which evaluates each part and then
returns the last value.

only 8 lines! that isn't much for what this baby can do!
*/

function transform (observable, down, up) {
  return function (val) {
    return (
      get(val) ? down(observable())
    : set(val) ? observable((up || down)(val))
    : observable(function (_val) { val(down(_val)) })
    )}}

function not(observable) {
  return transform(observable, function (v) { return !v })
}

function listen (element, event, attr, listener) {
  function onEvent () {
    listener(element[attr])
  }
  element.addEventListener(event, onEvent, false)
  return function () {
    element.removeEventListener(event, onEvent, false)
  }
}

function attribute(element, attr, event) {
  attr = attr || 'value'; event = event || 'input'
  return function (val) {
    return (
      get(val) ? element[attr]
    : set(val) ? element[attr] = val
    : listen(element, event, attr, val)
    )}}


function html (element) {
  return attribute(element, 'innerHTML', false) //read only
}

function error (message) {
  throw new Error(message)
}

function compute (observables, compute) {
  function getAll() {
    return compute.apply(null, observables.map(function (e) {return e()}))
  }
  return function (val) {
    return (
      get(val) ? getAll()
    : set(val) ? error('read-only')
    : observables.forEach(function (obs) {
        obs(function () { val(getAll()) })
      })
    )}}

function boolean (observable, truthy, falsey) {
  return transform(observable, function (val) {
      return val ? truthy : falsey
    }, function (val) {
      return val == truthy ? true : false
    })
  }

var exports = value

exports.value     = value
exports.not       = not
exports.input     =
exports.attribute = attribute
exports.html      = html
exports.compute   = compute
exports.transform = transform
exports.boolean   = boolean

if('object' === typeof module) module.exports = exports
else                           this.observable = exports
})()
var h = hyperscript
var o = observable
var a = [].slice.call(document.body.getElementsByTagName('pre'))

a.filter(function (e) {
  return !~[].slice.call(e.classList).indexOf('noedit')
}).forEach(function (e) {

  var textarea
  var demo = 
    h('div.demoIO', 
      textarea = h('textarea.demo.demoInput', 
        {cols: 80, rows: e.textContent.split('\n').length + 1}, 
        e.textContent),
      h('div', o.transform(o.input(textarea), function (code) {
          try         { 
            var r = eval(code) 
            if(r instanceof Node) 
              return r
            if(r == null)
              return h('pre.demo.demoNull', r === null ? 'null' : 'undefined')

            return h('pre.demo.demoOutput', JSON.stringify(r, false, 2))
          } 
          catch (err) { return h('pre.demo.demoError', err.toString()) }
        })
      )
    )

  //no scrolling!
  //It's much nicer to just resize the textarea to fit

  o.input(textarea)(function (v) {
    textarea.rows = v.split('\n').length + 1
  })

  e.parentElement.replaceChild(demo, e)


})

;})();
