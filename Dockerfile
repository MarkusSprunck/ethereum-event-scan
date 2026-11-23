FROM nginx:stable-alpine-slim

# Update all
RUN apk update && apk upgrade

# force upgrade from edge/main because fixes are not yet in Alpine
RUN apk add --upgrade \
    --repository=https://dl-cdn.alpinelinux.org/alpine/edge/main \
    libexpat \
    'musl>=1.2.6-r6' \
    'musl-utils>=1.2.6-r6' \
    'busybox>=1.37.0-r31'

# nginx.conf does not use conf.d, so the IPv6 auto-config script has no effect
RUN rm -f /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh

COPY nginx.conf /etc/nginx/nginx.conf
COPY secure_headers.conf /etc/nginx/secure_headers.conf
COPY dist/ethereum-event-scan ./usr/share/nginx/html
RUN  cp /usr/share/nginx/html/index.html /usr/share/nginx/html/main.html

# Run as the unprivileged nginx user (uid 101). It only needs write access to
# its cache/log dirs; the pid file is in /tmp and port 8080 is above 1024.
# Content stays root-owned and read-only.
RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx
USER nginx
EXPOSE 8080
