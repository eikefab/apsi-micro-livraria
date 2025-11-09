FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY proto/ ./proto/

COPY services/controller/ ./services/controller/

EXPOSE 3000

CMD ["node", "services/controller/index.js"]
