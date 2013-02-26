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
        {cols: 80, rows: e.innerText.split('\n').length + 1}, 
        e.innerText),
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

