FROM debian

RUN apt-get update  -y && \
    apt-get install -y curl git-core && \
    curl -sL https://deb.nodesource.com/setup_11.x | bash - && \
    apt-get update  -y && \
    apt-get install -y nodejs

ADD ./ $HOME/

RUN rm -r ./.idea && \
    rm -r ./images && \
    rm -r ./test-files-abi-kovan && \
    rm ./.gitignore && \
    rm ./Dockerfile && \
    rm ./README.md && \
    rm ./*.sh

RUN npm install --production

RUN echo '#!/bin/bash\n\nnode ./src/server.js ${PARITY_NODE_IP_PORT} ${LOCAL_IP}\n' > /startscript.sh  &&\
    chmod +x /startscript.sh

ENTRYPOINT ["/startscript.sh"]
