FROM nginx:stable-alpine-slim

# Update all
RUN apk update && apk upgrade

# force upgrade from edge/main because fixes are not yet in Alpine
RUN apk add --upgrade \
    --repository=https://dl-cdn.alpinelinux.org/alpine/edge/main \
    libexpat \
    'busybox>=1.37.0-r31'

COPY nginx.conf /etc/nginx/nginx.conf
COPY secure_headers.conf /etc/nginx/secure_headers.conf
COPY dist/ethereum-event-scan ./usr/share/nginx/html
RUN  cp /usr/share/nginx/html/index.html /usr/share/nginx/html/main.html
