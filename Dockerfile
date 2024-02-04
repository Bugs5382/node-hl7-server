FROM node:20.11.0-alpine3.19

# set working directory in the image
WORKDIR /home/node/app

## copy over server
COPY docker .

## Run
RUN npm install
RUN npm i node-hl7-server

# EXPOSE
EXPOSE 3000

# COMMAND
CMD ["npm", "run", "server"]