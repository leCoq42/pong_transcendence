FROM node:latest

WORKDIR /app/backend

COPY package*.json .

RUN npm install

COPY . .

CMD [ "npm", "run", "start:dev", "--debug" ]