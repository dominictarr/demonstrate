#! /bin/bash

{
  echo ';(function () {'
  cat node_modules/hyperscript/index.js
  cat node_modules/observable/index.js
  cat _demo.js
  echo ';})();'
} > demo.js
