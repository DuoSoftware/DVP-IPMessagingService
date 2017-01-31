#FROM ubuntu
#RUN apt-get update
#RUN apt-get install -y git nodejs npm nodejs-legacy
#RUN git clone git://github.com/DuoSoftware/DVP-IPMessagingService.git /usr/local/src/ipmessagingservice
#RUN cd /usr/local/src/ipmessagingservice; npm install
#CMD ["nodejs", "/usr/local/src/ipmessagingservice/app.js"]

#EXPOSE 8886

FROM node:5.10.0
RUN git clone git://github.com/DuoSoftware/DVP-IPMessagingService.git /usr/local/src/ipmessagingservice
RUN cd /usr/local/src/ipmessagingservice;
WORKDIR /usr/local/src/ipmessagingservice
RUN npm install
EXPOSE 8886
CMD [ "node", "/usr/local/src/ipmessagingservice/app.js" ]