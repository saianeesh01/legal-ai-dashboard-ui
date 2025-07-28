# --- Build React frontend ---
FROM node:22 as client-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Backend build ---
FROM node:22 as backend
WORKDIR /app
COPY package*.json ./
RUN npm install --production=false
COPY server/. ./server/
COPY shared/. ./shared/
COPY vite.config.ts ./
COPY tsconfig.json ./
# Copy built React frontend from previous stage
COPY --from=client-build /app/dist ./client/build
EXPOSE 5000
CMD ["npx", "tsx", "server/index.ts"] 