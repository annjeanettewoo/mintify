# services/budget-service/Dockerfile

FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

ENV PORT=4002
EXPOSE 4002

# Use the start script from package.json ("start": "node src/index.js")
CMD ["npm", "start"]
