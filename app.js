/**
 * Created by Sukitha on 1/10/2017.
 */
var config = require("config");
var mongoose = require('mongoose');
var util = require('util');


var mongoip=config.Mongo.ip;
var mongoport=config.Mongo.port;
var mongodb=config.Mongo.dbname;
var mongouser=config.Mongo.user;
var mongopass = config.Mongo.password;

var connectionstring = util.format('mongodb://%s:%s@%s:%d/%s',mongouser,mongopass,mongoip,mongoport,mongodb);


mongoose.connection.on('error', function (err) {
    console.error( new Error(err));
});

mongoose.connection.on('disconnected', function() {
    console.error( new Error('Could not connect to database'));
});

mongoose.connection.once('open', function() {
    console.log("Connected to db");
});


mongoose.connect(connectionstring);


//var messanger = config.Host.messenger;


//if(messanger == 'user'){

    var usermessanger = require('./Workers/UserMessenger');

//}else{

    var clientmessanger = require('./Workers/ExternalUserMessenger');
//}

