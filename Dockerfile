FROM nginxinc/nginx-unprivileged:stable-alpine-slim

USER root
RUN apk update && apk upgrade --no-cache
USER 101

COPY nginx.conf /etc/nginx/nginx.conf
COPY secure_headers.conf /etc/nginx/secure_headers.conf
COPY --chown=101:101 dist/ethereum-event-scan /usr/share/nginx/html
COPY --chown=101:101 dist/ethereum-event-scan/index.html /usr/share/nginx/html/main.html

EXPOSE 8080
