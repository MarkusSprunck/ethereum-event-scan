# Ethereum-Event-Scan


This lightweight ethereum event explorer for smart contracts. 

![Image 1](./images/ethereum-event-scan.png "Connected via Infura.io")

## Motivation

It is a simple node.js application. A helpful tool when you develop smart 
contracts and your source codes is not submitted to Etherscan.


## Connection to local Parity Node

---

## Run Ethereum-Event-Scan via Blockchain Gateway

Use Infura.io to connect to a Blockcain ist the fastest way to 
get events from an deployed contract.

You will need a accout and project id. To get events via infura you 
must use the web socket connection provider.

like: wss://kovan.infura.io/ws/v3/{your-infura-project-id}

Three steps:

1) create infura-project and get ID


2) Enter this ID in the start script
  
   *start-ehtereum-event-scan-infura.sh*

3) Enter ABI and contract address *or* load abi-file from ./kovan-abi  


---


#### Install Parity

Open your terminal and enter:

$ `brew tap paritytech/paritytech`

$ `brew install parity`

#### Run Parity

$ `start-parity.sh`

Expected result: 

```
2019-08-24 22:43:28  Starting Parity-Ethereum/v2.5.6-stable-ff398fe7ff-20190812/x86_64-macos/rustc1.36.0
2019-08-24 22:43:28  Keys path /Users/markus/Library/Application Support/io.parity.ethereum/keys/kovan
2019-08-24 22:43:28  DB path /Users/markus/Library/Application Support/io.parity.ethereum/chains_light/kovan/db/9bf388941c25ea98
2019-08-24 22:43:28  Running in experimental Light Client mode.
2019-08-24 22:43:28  Debug API is not available in light client mode.
2019-08-24 22:43:28  Debug API is not available in light client mode.
2019-08-24 22:43:28  Listening for new connections on 0.0.0.0:8546.
2019-08-24 22:43:33  Public node URL: enode://5f47c99c2d609a50ec6b017837ff8a4004dee2483332512b1e532361ff788604b978f72cd5267b4fd2f13a7904817b3db44894d7cabf9decc1bc4728abaccee7@192.168.178.48:30303
2019-08-24 22:43:33  Syncing #12105728 0xa5d1…74cd   916.6 hdr/s      0+ 1028 Qed  10/50 peers      5 MiB cache  803 KiB queue  RPC:  0 conn,    0 req/s,    0 µs
2019-08-24 22:43:38  Syncing #12116503 0xecfe…dcba  2153.7 hdr/s      0+    0 Qed  13/50 peers     10 MiB cache  0 bytes queue  RPC:  0 conn,    0 req/s,    0 µs
2019-08-24 22:43:39  Accepted a new tcp connection from 127.0.0.1:63891.
2019-08-24 22:43:39  Accepted a new tcp connection from 127.0.0.1:63892.
2019-08-24 22:43:39  Accepted a new tcp connection from 127.0.0.1:63893.
2019-08-24 22:43:43  Syncing #12118039 0xb59b…821e   307.2 hdr/s      0+    0 Qed  13/50 peers     10 MiB cache  0 bytes queue  RPC:  3 conn,    0 req/s,    0 µs
2019-08-24 22:43:48  Syncing #12118551 0xd68d…057c   102.4 hdr/s      0+    0 Qed  10/50 peers     10 MiB cache  0 bytes queue  RPC:  3 conn,    0 req/s,    0 µs
2019-08-24 22:43:53  Syncing #12130818 0xcdb5…2d60  2452.4 hdr/s      0+27140 Qed  13/50 peers     10 MiB cache   21 MiB queue  RPC:  3 conn,    0 req/s,    0 µs
...
```

The synchronization will need some hours.

#### Run Monitor

$ `start-ehtereum-event-scan-local.sh`




