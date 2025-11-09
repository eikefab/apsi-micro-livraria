FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY proto/ ./proto/

COPY services/notifications/ ./services/notifications/

EXPOSE 3003

CMD ["node", "services/notifications/index.js"]
