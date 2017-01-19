/**
 * Created by Sukitha on 1/13/2017.
 */



/**
 * Created by Sukitha on 1/10/2017.
 */

var jwt = require('jsonwebtoken');
var socket = require('socket.io-client')('http://localhost:3334');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var uuid = require('node-uuid');
var fs = require('fs')


socket.on('connect', function(){

    logger.info("connected");


    var token = jwt.sign({
        "jti": uuid.v1(),
        "iss": "singer",
        "tenant": 1,
        "company": 103,
        "sub": "1234567890",
        "name": "John Doe",
        "admin": true,
        "attributes": ["60"],
        "priority": "0"
    }, 'abcdefgh');

    socket.emit('authenticate', {token: token});

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
});

socket.on('agent', function(data){

    logger.info(data);


    fs.readFile('D:\\Projects\\DVP\\DVP-IPMessagingService\\Workers\\3affbf0.jpg', 'utf8', function (err,data) {
        if (err) {
            logger.error(err);
        }else {
            socket.emit('message', {type: 'file', message: '3affbf0.jpg', to: 'sukitha', content:data});
        }
    });


});

socket.on('message', function(data){

    logger.info(data);

    socket.emit('seen',{to: data.to, uuid: data.id});

});

socket.on('seen', function(data){

    logger.info(data);
});

socket.on('typing', function(data){

    logger.info(data);
});

socket.on('disconnect', function(data){

    logger.info("disconnected");
});

socket.on('test', function(data){

    logger.info(data);
});

