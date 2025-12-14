npm run build
docker buildx create --name mybuilder
docker buildx use mybuilder
docker buildx build --platform linux/amd64,linux/arm64 -t sprunck/ethereum-event-scan:3.0.0 --push .
