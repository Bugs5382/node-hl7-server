FROM node:20.11.0-alpine3.19

# set working directory in the image
WORKDIR /home/node/app

## copy files over
COPY docker/package.json .
COPY docker/server.js .
COPY docker/tls.server.js .
COPY certs certs

## Run
RUN npm install
RUN npm i node-hl7-server

# EXPOSE
EXPOSE 3000