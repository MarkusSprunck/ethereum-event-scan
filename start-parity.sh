#!/usr/bin/env bash

# start local node
parity --chain kovan --jsonrpc-cors '*' \
                     --jsonrpc-hosts all \
                     --jsonrpc-interface all \
                     --unsafe-expose
