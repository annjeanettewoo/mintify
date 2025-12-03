# transact-service/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

ENV PORT=4003
EXPOSE 4003

CMD ["node", "src/index.js"]
