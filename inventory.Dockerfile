FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY proto/ ./proto/

COPY services/inventory/ ./services/inventory/

EXPOSE 3002

CMD ["node", "services/inventory/index.js"]
