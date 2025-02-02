FROM node:22

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY dist/index.js .

CMD [ "node", "index.js" ]