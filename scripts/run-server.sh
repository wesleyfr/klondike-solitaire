#!/bin/sh

#run a webserver that dynamically generate bundle.js when we edit it.
beefy ./js/solitaire.js:bundle.js --live --cwd ../src
