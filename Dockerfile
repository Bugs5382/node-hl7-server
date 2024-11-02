FROM node:20.11.0-alpine3.19

# Set working directory in the image
WORKDIR /home/node/app

## Copy files over
COPY docker/package.json .
COPY docker/server.js .
COPY docker/tls.server.js .
COPY certs certs

## Run
RUN npm install
RUN npm i node-hl7-server

## Expose
EXPOSE 3000

## Command
CMD ["npm","run", "server"]
