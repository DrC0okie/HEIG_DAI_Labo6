FROM node:19-alpine

# To check the active musicians with telnet/ncat
EXPOSE 2205/tcp

# Used port for the musicians to sen data to the auditor
EXPOSE 2023/udp

# To connect to the HTTP server
EXPOSE 3000

RUN mkdir /home/node/app

WORKDIR /home/node/app

COPY src/ /home/node/app/

ENTRYPOINT [ "node", "auditor.js" ]