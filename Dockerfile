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
COPY test_full_pipeline.js .

# Expose API port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Start production server
CMD ["npm", "run", "start"]
