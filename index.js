#! /usr/bin/env node

var marked = require('marked')
var join   = require('path').join

var r = Math.random() 
//step 1, parse the js out of a markdown file...
var fs = require('fs')
var exec = require('child_process').exec

var lexed = marked.lexer(fs.readFileSync(process.argv[2], 'utf-8'))
var funx = 'var funx = [\n' + lexed.filter(function(e) {
    return e.type == 'code'
  }).map(function (e) { 
    return 'function () {\n' + e.text + '\n}' 
  }).join(',\n') + '\n];\n';


fs.writeFileSync('./tmp.js', funx)

var markdown = marked.parser(lexed)

//create a static dir
//try { fs.mkdir('static') } catch (_) {}

//create a copy the template there... & insert markdown

//generate bundle
exec('browserify ./tmp.js --exports require --debug',
  {maxBuffer: 1024*1024},
  function (err, bundle) {
    if(err) throw err
    console.log(
      fs.readFileSync(join(__dirname, 'template.html'), 'utf-8')
        .replace('{{{MARKDOWN}}}', markdown)
        .replace('{{{SCRIPT}}}',
            fs.readFileSync(join(__dirname, 'demo.js'), 'utf-8'))
        .replace('{{{BUNDLE}}}', bundle)
    )
  })

/*
fs.writeFileSync(join('static', 'demo.js'), 
  fs.readFileSync(join(__dirname, 'demo.js')))

fs.writeFileSync(join('static', 'codemirror.js'), 
  fs.readFileSync(join(__dirname, 'codemirror.js')))
*/
