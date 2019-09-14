#!/usr/bin/env bash

# ensure that all libs have been installed
npm install --quiet

# resolve all dependencies of node libs to run in the browser
browserify ./src/main.js -o ./dist/bundle.js

# start node server
node ./src/server.js