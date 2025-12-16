npm run build
docker buildx build --platform linux/amd64,linux/arm64 -t sprunck/ethereum-event-scan:3.0.1 --push .
