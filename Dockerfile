FROM node:hydrogen-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci
RUN npm run build

COPY . .

EXPOSE 8888

CMD [ "node", "index.js" ]
