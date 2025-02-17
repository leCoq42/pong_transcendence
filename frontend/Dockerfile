FROM node:current-slim AS production
WORKDIR /app/frontend
COPY package*.json .
RUN npm install --production
COPY . .
RUN npm run build
CMD [ "npm", "run", "preview"]


FROM node:current-slim as development
WORKDIR /app/frontend
COPY package*.json .
RUN npm install
COPY . .
CMD [ "npm", "run", "dev"]