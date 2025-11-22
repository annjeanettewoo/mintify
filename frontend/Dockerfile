# frontend/Dockerfile

# ---- Stage 1: Build the Vite app ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---- Stage 2: Serve with nginx ----
FROM nginx:alpine

# Copy built files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 for HTTP traffic
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
