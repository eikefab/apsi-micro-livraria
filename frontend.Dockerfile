FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY services/frontend/ ./services/frontend/

EXPOSE 5000

CMD ["serve", "-s", "services/frontend", "-p", "5000"]
