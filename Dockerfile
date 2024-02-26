FROM nginx:stable
COPY nginx.conf /etc/nginx/nginx.conf
COPY secure_headers.conf /etc/nginx/secure_headers.conf
COPY dist/ethereum-event-scan ./usr/share/nginx/html
RUN  cp /usr/share/nginx/html/index.html /usr/share/nginx/html/main.html
