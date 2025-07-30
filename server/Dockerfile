# --- Build React frontend ---

#    FROM node:22 AS client-build
#WORKDIR /app
#COPY package*.json ./
#RUN npm ci
#COPY . .

# Ensure vite is available in frontend build stage
#RUN npm install vite tsx --save-dev
#RUN npm run build

# --- Backend build ---
#FROM node:22 AS frontend
#WORKDIR /app

# Copy only package files first for caching
#COPY package*.json ./

# ✅ Install ALL dependencies (prod + dev) to include vite & tsx
#RUN npm ci

# Copy backend and shared code
#COPY server/. ./server/
#COPY shared/. ./shared/
#COPY vite.config.ts ./
#COPY tsconfig.json ./

# Copy built React frontend
#COPY --from=client-build /app/dist ./client/build

# Expose backend port
#EXPOSE 5000

# ✅ Use tsx for TypeScript execution
#CMD ["npx", "tsx", "server/index.ts"]






# --- Build React frontend ---
FROM node:22 AS client-build
WORKDIR /app

# Install base dependencies
COPY package*.json ./
RUN npm ci

# Install Vite & TSX for build
RUN npm install --save-dev vite tsx typescript @types/node

# Copy source
COPY . .

# Build frontend
RUN npm run build

# --- Backend build ---
FROM node:22 AS frontend
WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm ci

# Copy backend and shared code
COPY server/. ./server/
COPY shared/. ./shared/
COPY vite.config.ts ./ 
COPY tsconfig.json ./

# Copy built frontend
COPY --from=client-build /app/dist ./client/build

# Expose backend port
EXPOSE 5000

# Use tsx for runtime TypeScript execution
CMD ["npx", "tsx", "server/index.ts"]

