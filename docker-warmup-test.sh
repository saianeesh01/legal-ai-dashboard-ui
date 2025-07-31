#!/bin/bash

echo "🐳 Testing Docker Warmup System"
echo "================================"

# Check if containers are running
echo "📋 Checking container status..."
docker-compose ps

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Test AI service health
echo "🏥 Testing AI service health..."
curl -s http://localhost:5001/health | head -5

# Test warmup endpoint
echo "🔥 Testing warmup endpoint..."
curl -X POST http://localhost:5001/warmup/auto \
    -H "Content-Type: application/json" \
    --max-time 60 \
    --connect-timeout 10

# Test frontend warmup API
echo "🌐 Testing frontend warmup API..."
curl -X POST http://localhost:5000/api/warmup \
    -H "Content-Type: application/json" \
    --max-time 60

echo "✅ Docker warmup test completed"