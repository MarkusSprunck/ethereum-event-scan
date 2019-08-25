#!/usr/bin/env bash

# find current local ip address (of your mac
export LOCAL_IP=$(ipconfig getifaddr en0)

docker stop     ethereum-event-scan
docker rm       ethereum-event-scan
docker build -t ethereum-event-scan:latest ../.
docker run -dit                                               \
           -p $LOCAL_IP:55226:55226                           \
           -e LOCAL_IP=$LOCAL_IP                              \
           -e PARITY_NODE_IP_PORT=http://$LOCAL_IP:8545       \
           --name ethereum-event-scan
