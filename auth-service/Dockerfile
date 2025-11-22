# auth-service/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

ENV PORT=4001
EXPOSE 4001

CMD ["node", "index.js"]
