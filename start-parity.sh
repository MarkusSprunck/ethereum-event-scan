#!/usr/bin/env bash

# start local node
parity --chain kovan --ws-apis="web3,eth,net"       \
                     --ws-origins="localhost:55226" \
                     --no-jsonrpc                   \
                     --no-ipc

