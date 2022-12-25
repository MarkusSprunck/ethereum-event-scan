### STAGE 1: Build ###
FROM alpine:3.17.0 AS build

RUN echo "Install python, make and g++"
RUN apk add --no-cache --virtual .gyp \
        python \
        make \
        g++

RUN echo "Install NPM AND YARN and some essentials deps"
RUN apk --no-cache add \
    nodejs-npm \
    curl \
    yarn \
    tar \
    gzip \
    bash \
    git \
    unzip \
    wget \
    openssh-client \
    openssh \
    sudo

RUN echo "Upgrade all dependecies"
RUN apk upgrade

WORKDIR /usr/src/app
COPY . .
RUN npm install
RUN npm run build

### STAGE 2: Run ###
FROM nginx:stable
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /usr/src/app/dist/ethereum-event-scan /usr/share/nginx/html
RUN  cp /usr/share/nginx/html/index.html /usr/share/nginx/html/main.html
