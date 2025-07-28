FROM node:22 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22 as prod
WORKDIR /app
COPY --from=build /app/dist /app/build 