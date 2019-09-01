# Ethereum-Event-Scan

Ethereum-Event-Scan is a lightweight ethereum event explorer for smart contracts. 


![Image 1](./images/ethereum-event-scan.png "Connected via Infura.io")

It is a simple node.js application - the right tool when you develop smart contracts and your source codes is not yet submitted to Etherscan.

## Connect Ethereum-Event-Scan to Kovan via Blockchain Gateway

Use Infura.io to connect to a Blockcain is the fastest way to get events from an deployed contract.

You will need an account and project id. To get events via infura you must use the web socket connection provider.

Like:
 
 `wss://kovan.infura.io/ws/v3/{your-infura-project-id}`
 

Three steps:

- Create infura-project and get *the Infura Project ID*

- Edit *start-ehtereum-event-scan-infura.sh* this ID in the start script
   
- Enter ABI and contract address *or* load abi-file from ./kovan-abi  


## Connect Ethereum-Event-Scan to Kovan via Local Parity Node


#### Install parity

Open your terminal and enter:

$ `brew tap paritytech/paritytech`

$ `brew install parity`

#### Run Parity

$ `start-parity.sh`

This start script enables just the needed api for the ethereum event scan for web socket connections.

```
#!/usr/bin/env bash

# start local node
parity --chain kovan --ws-apis="web3,eth,net"       \
                     --ws-origins="localhost:55226" \
                     --no-jsonrpc                   \
                     --no-ipc
```

The synchronization may need a day. In the case the synchronization got stuck, just restart. 

Expected log output after complete sync and restart:

```
2019-09-01 12:01:35  Starting Parity-Ethereum/v2.5.6-stable-ff398fe7ff-20190812/x86_64-macos/rustc1.36.0
2019-09-01 12:01:35  Keys path /Users/markus/Library/Application Support/io.parity.ethereum/keys/kovan
2019-09-01 12:01:35  DB path /Users/markus/Library/Application Support/io.parity.ethereum/chains/kovan/db/9bf388941c25ea98
2019-09-01 12:01:35  State DB configuration: fast
2019-09-01 12:01:35  Operating mode: active
2019-09-01 12:01:35  Configured for Kovan Testnet using AuthorityRound engine
2019-09-01 12:01:37  Listening for new connections on 127.0.0.1:8546.
2019-09-01 12:01:42  Public node URL: enode://5f47c99c2d609a50ec6b017837ff8a4004dee2483332512b1e532361ff788604b978f72cd5267b4fd2f13a7904817b3db44894d7cabf9decc1bc4728abaccee7@192.168.178.48:30303
2019-09-01 12:01:48  Imported #13206843 0xb98c…46cf (2 txs, 0.17 Mgas, 6 ms, 2.39 KiB) + another 10 block(s) containing 16 tx(s)
2019-09-01 12:01:52  Imported #13206844 0x45c3…170e (1 txs, 0.04 Mgas, 2 ms, 0.71 KiB)
2019-09-01 12:01:56  Imported #13206845 0x7231…e422 (1 txs, 0.04 Mgas, 1 ms, 0.71 KiB)
2019-09-01 12:02:00  Imported #13206846 0x36ef…14cb (1 txs, 0.04 Mgas, 1 ms, 0.71 KiB)
2019-09-01 12:02:04  Imported #13206847 0x234c…13cb (2 txs, 0.14 Mgas, 8 ms, 1.76 KiB)
2019-09-01 12:02:08  Imported #13206848 0x0b26…8fcf (0 txs, 0.00 Mgas, 1 ms, 0.57 KiB)
2019-09-01 12:02:12  Imported #13206849 0x9d9d…c694 (1 txs, 0.34 Mgas, 13 ms, 0.88 KiB)
2019-09-01 12:02:12     3/25 peers    773 KiB chain    9 MiB db  0 bytes queue  221 KiB sync  RPC:  0 conn,    0 req/s,    0 µs
```

#### Run Monitor

$ `start-ehtereum-event-scan-local.sh`




