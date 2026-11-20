FROM nginxinc/nginx-unprivileged:stable-alpine-slim

USER root
# nginx/musl fixes are not yet in the stable Alpine branch -> take them from edge/main
RUN apk upgrade --no-cache && \
    apk add --no-cache --upgrade \
      --repository=https://dl-cdn.alpinelinux.org/alpine/edge/main \
      nginx musl musl-utils
USER 101

COPY nginx.conf /etc/nginx/nginx.conf
COPY secure_headers.conf /etc/nginx/secure_headers.conf
COPY --chown=101:101 dist/ethereum-event-scan /usr/share/nginx/html
COPY --chown=101:101 dist/ethereum-event-scan/index.html /usr/share/nginx/html/main.html

EXPOSE 8080
