FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the app (including src/index.js, db, routes, models etc.)
COPY . .

ENV NODE_ENV=production
ENV PORT=4004

EXPOSE 4004

# IMPORTANT: entrypoint is src/index.js
CMD ["node", "src/index.js"]
