#!/bin/bash

# 🚀 Ollama Performance Optimization Script
# This script optimizes Ollama for faster communication with the Legal AI Dashboard

echo "🚀 Optimizing Ollama for faster communication..."

# Stop existing Ollama process
echo "📋 Stopping existing Ollama process..."
pkill -f ollama || true

# Wait for process to stop
sleep 2

# Set environment variables for optimal performance
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_NUM_PARALLEL=2
export OLLAMA_CONTEXT_LENGTH=1024
export OLLAMA_KEEP_ALIVE=5m
export OLLAMA_GPU_LAYERS=0
export OLLAMA_THREADS=4
export OLLAMA_BATCH_SIZE=512

echo "⚙️  Starting Ollama with optimized settings..."
echo "   - Parallel processing: $OLLAMA_NUM_PARALLEL"
echo "   - Context length: $OLLAMA_CONTEXT_LENGTH"
echo "   - Keep alive: $OLLAMA_KEEP_ALIVE"
echo "   - CPU threads: $OLLAMA_THREADS"
echo "   - Batch size: $OLLAMA_BATCH_SIZE"

# Start Ollama with optimized settings
ollama serve &

# Wait for Ollama to start
echo "⏳ Waiting for Ollama to start..."
sleep 5

# Check if Ollama is running
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama is running with optimized settings"
    
    # Pull the optimized model if not already present
    echo "📥 Ensuring optimized model is available..."
    ollama pull mistral:7b-instruct-q4_0
    
    echo "🎯 Ollama optimization complete!"
    echo "   - Server running on: $OLLAMA_HOST"
    echo "   - Model: mistral:7b-instruct-q4_0"
    echo "   - Ready for fast communication with Legal AI Dashboard"
else
    echo "❌ Failed to start Ollama with optimized settings"
    exit 1
fi 