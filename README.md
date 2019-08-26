# Ethereum-Event-Scan


This lightweight ethereum event explorer for smart contracts. It is a simple node.js application. A helpful tool when 
you develop smart contracts and your source codes is not submitted to Etherscan.

![Image 1](./images/ethereum-event-scan.png "Connected via Infura.io")


## Run Ethereum-Event-Scan via Blockchain Gateway

Use Infura.io to connect to a Blockcain is the fastest way to get events from an deployed contract.

You will need an account and project id. To get events via infura you must use the web socket connection provider.

Like:
 
 `wss://kovan.infura.io/ws/v3/{your-infura-project-id}`
 

Three steps:

- Create infura-project and get *the Infura Project ID*

- Edit *start-ehtereum-event-scan-infura.sh* this ID in the start script
   
- Enter ABI and contract address *or* load abi-file from ./kovan-abi  


## Run Ethereum-Event-Scan via local parity node


#### Install parity

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

The synchronization may need a day. In the case the synchronization got stuck, just restart. 

Expected log output after complete sync:

```
2019-08-26 21:43:26  Starting Parity-Ethereum/v2.5.6-stable-ff398fe7ff-20190812/x86_64-macos/rustc1.36.0
2019-08-26 21:43:26  Keys path /Users/markus/Library/Application Support/io.parity.ethereum/keys/kovan
2019-08-26 21:43:26  DB path /Users/markus/Library/Application Support/io.parity.ethereum/chains/kovan/db/9bf388941c25ea98
2019-08-26 21:43:26  State DB configuration: fast
2019-08-26 21:43:26  Operating mode: active
2019-08-26 21:43:26  Configured for Kovan Testnet using AuthorityRound engine
2019-08-26 21:43:27  Listening for new connections on 0.0.0.0:8546.
2019-08-26 21:43:32  Public node URL: enode://5f47c99c2d609a50ec6b017837ff8a4004dee2483332512b1e532361ff788604b978f72cd5267b4fd2f13a7904817b3db44894d7cabf9decc1bc4728abaccee7@192.168.178.48:30303
2019-08-26 21:43:36  Imported #13086063 0x9259…a376 (1 txs, 0.11 Mgas, 3 ms, 1.72 KiB) + another 12 block(s) containing 8 tx(s)
2019-08-26 21:43:40  Imported #13086064 0x3af8…730d (2 txs, 0.13 Mgas, 2 ms, 1.45 KiB)
2019-08-26 21:43:44  Imported #13086065 0x3dad…79a9 (0 txs, 0.00 Mgas, 1 ms, 0.57 KiB)
2019-08-26 21:43:48  Imported #13086066 0xdb79…9e2d (0 txs, 0.00 Mgas, 0 ms, 0.57 KiB)
2019-08-26 21:43:52  Imported #13086067 0xb916…eaca (0 txs, 0.00 Mgas, 0 ms, 0.57 KiB)
2019-08-26 21:43:56  Imported #13086068 0x58c4…104a (1 txs, 0.07 Mgas, 3 ms, 1.34 KiB)
2019-08-26 21:44:00  Imported #13086069 0xae6a…eb64 (1 txs, 0.10 Mgas, 2 ms, 1.63 KiB)
2019-08-26 21:44:02     4/25 peers   162 KiB chain 9 MiB db 0 bytes queue 223 KiB sync  RPC:  0 conn,    3 req/s,   15 µs
2019-08-26 21:44:04  Imported #13086070 0xd70e…48da (8 txs, 0.70 Mgas, 11 ms, 3.54 KiB)
2019-08-26 21:44:08  Imported #13086071 0xeff5…6c8d (0 txs, 0.00 Mgas, 0 ms, 0.57 KiB)
2019-08-26 21:44:12  Imported #13086072 0x5bab…1b1d (0 txs, 0.00 Mgas, 1 ms, 0.57 KiB)
2019-08-26 21:44:16  Imported #13086073 0xee70…343e (2 txs, 0.15 Mgas, 3 ms, 1.89 KiB)
2019-08-26 21:44:20  Imported #13086074 0x4485…181b (0 txs, 0.00 Mgas, 0 ms, 0.57 KiB)
2019-08-26 21:44:24  Imported #13086075 0x34fa…e284 (1 txs, 0.07 Mgas, 3 ms, 1.34 KiB)
2019-08-26 21:44:28  Imported #13086076 0x8473…1745 (1 txs, 0.17 Mgas, 9 ms, 0.97 KiB)
2019-08-26 21:44:32     4/25 peers   179 KiB chain 9 MiB db 0 bytes queue 223 KiB sync  RPC:  0 conn,    3 req/s,   13 µs

```

#### Run Monitor

$ `start-ehtereum-event-scan-local.sh`




