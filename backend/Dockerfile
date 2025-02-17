FROM node:current-slim AS production
WORKDIR /app/backend
COPY package*.json .
RUN npm install --production
COPY . .
RUN npm run build
CMD [ "npm", "run", "start:prod"]

FROM node:current-slim AS development
WORKDIR /app/backend
COPY package*.json .
RUN npm install
COPY . .
CMD [ "npm", "run", "start:dev", "--debug" ]
