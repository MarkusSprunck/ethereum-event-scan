npm run build
docker buildx build --platform linux/amd64,linux/arm64 -t sprunck/ethereum-event-scan:v3.0.2 --push .
