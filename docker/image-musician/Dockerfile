FROM node:19-alpine

RUN mkdir /home/node/app

WORKDIR /home/node/app

COPY src/ /home/node/app/

ENTRYPOINT [ "node", "musician.js" ]