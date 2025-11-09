FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY proto/ ./proto/

COPY services/shipping/ ./services/shipping/

EXPOSE 3001

CMD ["node", "services/shipping/index.js"]
