FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY src ./src

# Env + port
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "src/index.js"]
