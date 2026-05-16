
FROM node:24-alpine

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY . .

ENV PORT=3000

CMD ["node", "src/server.js"]
