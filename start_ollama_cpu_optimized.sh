#!/bin/bash

# ✅ CPU-Optimized Ollama Startup Script
# This script starts Ollama with CPU optimizations for legal document processing

echo "🚀 Starting Ollama with CPU optimizations..."

# ✅ 6. Adjust CPU scheduling - use nice to reduce priority
# Check if Ollama is already running
if pgrep -x "ollama" > /dev/null; then
    echo "⚠️  Ollama is already running. Stopping existing process..."
    pkill ollama
    sleep 2
fi

# ✅ Set CPU optimizations
export OLLAMA_NUM_PARALLEL=1
export OLLAMA_CONTEXT_LENGTH=1024

# ✅ Start Ollama with reduced priority and CPU optimizations
echo "🔧 Starting Ollama with CPU optimizations:"
echo "   - Parallel requests: $OLLAMA_NUM_PARALLEL"
echo "   - Context length: $OLLAMA_CONTEXT_LENGTH"
echo "   - CPU priority: reduced (nice -n 10)"

# Start Ollama with reduced priority
nice -n 10 ollama serve &

# Wait for Ollama to start
echo "⏳ Waiting for Ollama to start..."
sleep 5

# Check if Ollama is running
if pgrep -x "ollama" > /dev/null; then
    echo "✅ Ollama started successfully with CPU optimizations"
    
    # Pull optimized models if not already available
    echo "📥 Checking for optimized models..."
    
    # Check if mistral:7b-instruct-q4_0 is available
    if ! ollama list | grep -q "mistral:7b-instruct-q4_0"; then
        echo "📥 Pulling optimized model: mistral:7b-instruct-q4_0"
        ollama pull mistral:7b-instruct-q4_0
    else
        echo "✅ mistral:7b-instruct-q4_0 already available"
    fi
    
    # Check if gemma:2b is available (fallback)
    if ! ollama list | grep -q "gemma:2b"; then
        echo "📥 Pulling fallback model: gemma:2b"
        ollama pull gemma:2b
    else
        echo "✅ gemma:2b already available"
    fi
    
    echo "🎯 Ollama is ready for CPU-optimized legal document processing"
    echo "   - Sequential processing enabled"
    echo "   - Reduced context length: 1024"
    echo "   - Optimized models: mistral:7b-instruct-q4_0, gemma:2b"
    
else
    echo "❌ Failed to start Ollama"
    exit 1
fi

# Keep the script running to maintain Ollama process
echo "🔄 Ollama is running. Press Ctrl+C to stop."
wait 