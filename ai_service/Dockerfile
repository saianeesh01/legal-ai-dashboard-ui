FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create a startup script that handles warmup
RUN cat > start.sh << 'EOF'
#!/bin/bash
echo "Starting AI Service..."

# Start Flask app in background
python app.py &
FLASK_PID=$!

# Wait for Flask to be ready
echo "Waiting for Flask to start..."
sleep 5

# Attempt warmup if WARMUP_ON_START is set
if [ "$WARMUP_ON_START" = "true" ]; then
    echo "Attempting model warmup..."
    for i in {1..3}; do
        echo "Warmup attempt $i/3..."
        curl -X POST http://localhost:5001/warmup/auto \
            -H "Content-Type: application/json" \
            --max-time 30 \
            --connect-timeout 10 && break
        echo "Warmup attempt $i failed, retrying in 10 seconds..."
        sleep 10
    done
fi

# Wait for Flask process
wait $FLASK_PID
EOF

RUN chmod +x start.sh

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:5001/health || exit 1

CMD ["./start.sh"]