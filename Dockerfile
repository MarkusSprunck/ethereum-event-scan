FROM debian

MAINTAINER sprunck.markus@gmail.com

RUN echo 'Ethereum-Event-Scan for events of smart contracts'

EXPOSE 55226/tcp

RUN apt-get update  -y && \
    apt-get install -y curl git-core && \
    apt-get install -y curl git vim make build-essential  && \
    curl -sL https://deb.nodesource.com/setup_11.x | bash - && \
    apt-get update  -y && \
    apt-get install -y nodejs

ADD ./ $HOME/

RUN npm install --production  && \
    npm install -g browserify && \
    browserify ./src/main.js -o ./dist/bundle.js

RUN echo '#!/bin/bash\n\nnode ./src/server.js ${PARITY_NODE_IP_PORT} ${LOCAL_IP}\n' > /startscript.sh && \
    chmod +x /startscript.sh

ENTRYPOINT ["/startscript.sh"]
