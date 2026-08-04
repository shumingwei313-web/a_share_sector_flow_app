FROM node:24-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV PORT=4173
ENV CAPTURE_PROVIDER=auto
EXPOSE 4173

CMD ["node", "server.js"]
