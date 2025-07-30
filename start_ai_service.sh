#!/bin/bash
echo "Starting Legal AI Service..."
cd ai_service
export FLASK_ENV=development
export PYTHONPATH=/home/runner/workspace/ai_service
python3 app.py