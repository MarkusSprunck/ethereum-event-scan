#!/usr/bin/env bash

docker stop     ethereum-event-scan
docker rm       ethereum-event-scan
docker run -dit                        \
           -p 55226:55226              \
           --name ethereum-event-scan  \
           ethereum-event-scan:latest

