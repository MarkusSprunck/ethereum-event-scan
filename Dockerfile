FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY dist/ethereum-event-scan ./usr/share/nginx/html
RUN  cp /usr/share/nginx/html/index.html /usr/share/nginx/html/main.html
