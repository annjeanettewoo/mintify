# budget-service/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

ENV PORT=4002
EXPOSE 4002

CMD ["node", "src/index.js"]
