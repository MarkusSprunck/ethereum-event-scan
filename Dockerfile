### STAGE 1: Build ###
FROM node:12.16-alpine AS build
WORKDIR /usr/src/app
COPY . .
RUN npm update --silent
RUN npm run build

### STAGE 2: Run ###
FROM nginx:1.17.1-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /usr/src/app/dist/ethereum-event-scan /usr/share/nginx/html
RUN  cp /usr/share/nginx/html/index.html /usr/share/nginx/html/main.html