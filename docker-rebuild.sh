#!/bin/bash

# Legal AI Docker Rebuild Script
echo "🔄 Rebuilding Legal AI Docker containers..."

# Stop and remove existing containers
docker-compose down --remove-orphans 2>/dev/null || true

# Remove old images to force rebuild
docker rmi $(docker images "legal-ai*" -q) 2>/dev/null || true

# Build and start containers
docker-compose up --build -d

echo "✅ Containers rebuilt and started!"
echo "🌐 Frontend: http://localhost:5000"
echo "🤖 AI Service: http://localhost:5001"

# Show container status
docker-compose ps