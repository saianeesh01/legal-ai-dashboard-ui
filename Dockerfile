# ---------- 1️⃣ Build Stage ----------
FROM node:22-bookworm-slim AS build

# Install system dependencies including OCR support
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    curl \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first (better cache)
COPY package*.json ./
COPY pyproject.toml ./

# ✅ Install ALL dependencies (prod + dev)
RUN npm install --legacy-peer-deps

# Install Python dependencies if a requirements.txt exists
COPY requirements.txt ./
RUN if [ -f "requirements.txt" ]; then pip3 install --no-cache-dir --break-system-packages -r requirements.txt; fi

# Copy full source code
COPY . .

# Build frontend
RUN npm run build

# ---------- 2️⃣ Production Stage ----------
FROM node:22-bookworm-slim AS prod

WORKDIR /app

# ✅ Install ALL dependencies again (dev tools included)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy build artifacts and server code
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/shared ./shared

# Expose API port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Create startup script for warmup integration
RUN echo '#!/bin/bash' > /app/docker-start.sh && \
    echo 'echo "Starting Legal AI Platform..."' >> /app/docker-start.sh && \
    echo 'if [ "$WARMUP_ON_START" = "true" ] && [ "$AI_SERVICE_URL" ]; then' >> /app/docker-start.sh && \
    echo '  echo "Checking AI service availability..."' >> /app/docker-start.sh && \
    echo '  for i in {1..30}; do' >> /app/docker-start.sh && \
    echo '    if curl -s "$AI_SERVICE_URL/health" > /dev/null 2>&1; then' >> /app/docker-start.sh && \
    echo '      echo "AI service is ready"' >> /app/docker-start.sh && \
    echo '      break' >> /app/docker-start.sh && \
    echo '    fi' >> /app/docker-start.sh && \
    echo '    echo "Waiting for AI service... ($i/30)"' >> /app/docker-start.sh && \
    echo '    sleep 2' >> /app/docker-start.sh && \
    echo '  done' >> /app/docker-start.sh && \
    echo 'fi' >> /app/docker-start.sh && \
    echo 'exec npm run start' >> /app/docker-start.sh && \
    chmod +x /app/docker-start.sh

# Start services
CMD ["/app/docker-start.sh"]
