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

echo ""
echo "🔥 Warmup Status:"
echo "- Automatic warmup enabled in AI service"
echo "- To test warmup: ./docker-warmup-test.sh"
echo "- Manual warmup: node warmup-model.js"

# Wait for services and show warmup status
sleep 10
echo ""
echo "📊 Service Health Check:"
curl -s http://localhost:5001/health | head -3 || echo "AI service starting..."
curl -s http://localhost:5000/api/warmup/status | head -3 || echo "Frontend starting..."