FROM node:hydrogen-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm ci

COPY . .

RUN npx tsc *.ts

EXPOSE 8888

CMD [ "node", "index.js" ]
