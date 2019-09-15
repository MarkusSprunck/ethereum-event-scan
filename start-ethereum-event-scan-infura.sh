#!/usr/bin/env bash

# ensure that all libs have been installed
npm install --quiet

# resolve all dependencies of node libs to run in the browser
browserify ./src/main.js -o ./dist/bundle.js

#TODO: insert your personal infura project id here...
export INFURA_PROJECT_ID={change-me}

# start node server
node ./src/server.js wss://kovan.infura.io/ws/v3/${INFURA_PROJECT_ID} localhost

