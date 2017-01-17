/**
 * Created by Sukitha on 1/10/2017.
 */


var socket = require('socket.io-client')('http://localhost:3333');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;

socket.on('connect', function(){

    logger.info("connected");

    socket.emit('authenticate', {token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdWtpdGhhIiwianRpIjoiMTdmZTE4M2QtM2QyNC00NjQwLTg1NTgtNWFkNGQ5YzVlMzE1Iiwic3ViIjoiNTZhOWU3NTlmYjA3MTkwN2EwMDAwMDAxMjVkOWU4MGI1YzdjNGY5ODQ2NmY5MjExNzk2ZWJmNDMiLCJleHAiOjE4OTMzMDI3NTMsInRlbmFudCI6MSwiY29tcGFueSI6MTAzLCJzY29wZSI6W3sicmVzb3VyY2UiOiJhbGwiLCJhY3Rpb25zIjoiYWxsIn1dLCJpYXQiOjE0NjEyOTkxNTN9.PNiDQ9z-966GZlQQGaX23-VdBRi1UR0gA4nfehgi19c"});

    //socket.emit('request',{request:'oldmessages', from:'John Doe', to: 'sukitha', uuid: '949f5e50-da50-11e6-a30d-5b0aa8552477'});

});

socket.on('echo', function(data){

    logger.info(data);
});

socket.on('unauthorized', function(msg) {
    console.log("unauthorized: " + JSON.stringify(msg.data));
    throw new Error(msg.data.type);
});

socket.on('authenticated', function () {

    socket.emit( 'status', {presence: 'online'});
    //socket.emit( 'message', {message: 'test', to: 'sukitha'});
})

socket.on('event', function(data){

    logger.info(data);
});

socket.on('status', function(data){

    logger.info(data);
    socket.emit('request',{request:'latestmessages', from:'John Doe', to: 'sukitha', uuid: '949f5e50-da50-11e6-a30d-5b0aa8552477'});

});

socket.on('message', function(data){

    logger.info(data);

    socket.emit('seen',{to: data.to, uuid: data.id});

});

socket.on('seen', function(data){

    logger.info(data);
});

socket.on('latestmessages', function(data){

    logger.info(data);
});


socket.on('typing', function(data){

    logger.info(data);
});

socket.on('disconnect', function(data){

    logger.info("disconnected");
});

socket.on('client', function(data){

    logger.info(data);

    socket.emit('accept',{to: data.jti});
});