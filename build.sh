npm run build
docker buildx create --name mybuilder
docker buildx use mybuilder
docker buildx build --platform linux/amd64,linux/arm64 -t sprunck/ethereum-event-scan:v23 --push .
