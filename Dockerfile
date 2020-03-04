### STAGE 1: Build ###
FROM node:12.16-alpine AS build
WORKDIR /usr/src/app
COPY . .
RUN npm update --silent
RUN npm run build

### STAGE 2: Run ###
FROM nginx:1.17.1-alpine
COPY --from=build /usr/src/app/dist/ethereum-event-scan /usr/share/nginx/html