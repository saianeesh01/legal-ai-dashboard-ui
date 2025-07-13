#!/bin/bash

# Start AI Service
echo "Starting AI Document Analysis Service..."

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "Warning: Ollama is not running. Please start it with: ollama serve"
    echo "And pull a model with: ollama pull llama3.2:3b"
fi

# Install Python dependencies
pip install -r requirements.txt

# Start Flask service
python app.py