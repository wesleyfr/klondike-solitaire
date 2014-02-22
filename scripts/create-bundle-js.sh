#!/bin/sh

#create bundle.js when we are ready for release
browserify ../src/js/solitaire.js -o ../src/bundle.js

