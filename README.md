# Ethereum-Event-Scan

Ethereum-Event-Scan is a lightweight Ethereum event explorer for smart contracts. 
The right tool when you develop smart contracts (and your source codes has not been
submitted to EtherScan). Also in the case you work with a private blockchain you 
may use Ethereum-Event-Scan.

## Start 

Start directly with docker-cli:

```
$ docker run -dit -p 55226:80 --name ethereum-event-scan sprunck/ethereum-event-scan:latest  
```

or 

use docker-compose.yml:

```
version: '3.7'

services:

  ethereum-event-scan:
    image: sprunck/ethereum-event-scan:3.0.0
    container_name: ethereum-event-scan
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '55226:80'
```

## Build

You may download the sources and build with docker-compose:

```
$ docker-compose up -d --build   
```

## Links

Detailed description:

https://www.sw-engineering-candies.com/blog-1/Ethereum-Event-Explorer-for-Smart-Contracts

Docker image:

https://cloud.docker.com/u/sprunck/repository/docker/sprunck/ethereum-event-scan

Source code:

https://github.com/MarkusSprunck/ethereum-event-scan
