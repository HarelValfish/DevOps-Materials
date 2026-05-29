# Small base image keeps the build fast for a live demo.
FROM node:20-alpine

WORKDIR /app

# Copy manifest first so dependency install is layer-cached.
COPY package.json ./
RUN npm install --omit=dev

# Copy the application source.
COPY server.js ./

EXPOSE 3000

CMD ["node", "server.js"]
