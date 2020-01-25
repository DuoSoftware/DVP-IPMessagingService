#FROM ubuntu
#RUN apt-get update
#RUN apt-get install -y git nodejs npm nodejs-legacy
#RUN git clone git://github.com/DuoSoftware/DVP-IPMessagingService.git /usr/local/src/ipmessagingservice
#RUN cd /usr/local/src/ipmessagingservice; npm install
#CMD ["nodejs", "/usr/local/src/ipmessagingservice/app.js"]

#EXPOSE 8889

# FROM node:9.9.0
# ARG VERSION_TAG
# RUN git clone -b $VERSION_TAG https://github.com/DuoSoftware/DVP-IPMessagingService.git /usr/local/src/ipmessagingservice
# RUN cd /usr/local/src/ipmessagingservice;
# WORKDIR /usr/local/src/ipmessagingservice
# RUN npm install
# EXPOSE 8889 8890
# CMD [ "node", "/usr/local/src/ipmessagingservice/app.js" ]

FROM node:10-alpine
WORKDIR /usr/local/src/ipmessagingservice
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8889 8890
CMD [ "node", "app.js" ]
