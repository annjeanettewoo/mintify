# ---- Stage 1: Build the Vite app ----
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# ---------- Build-time environment variables for Vite ----------
# These will be passed from GitHub Actions via --build-arg
ARG VITE_AUTH_BASE_URL
ARG VITE_API_BASE_URL

# Make them available to Vite during the build
ENV VITE_AUTH_BASE_URL=$VITE_AUTH_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the production bundle
RUN npm run build

# ---- Stage 2: Serve with nginx ----
FROM nginx:alpine

# Copy built static files from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 for HTTP traffic
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
