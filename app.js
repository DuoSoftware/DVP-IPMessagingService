/**
 * Created by Sukitha on 1/10/2017.
 */
var config = require("config");
var mongoose = require('mongoose');
var util = require('util');
var ards = require('./Workers/Ards');


//var mongoip=config.Mongo.ip;
//var mongoport=config.Mongo.port;
//var mongodb=config.Mongo.dbname;
//var mongouser=config.Mongo.user;
//var mongopass = config.Mongo.password;
//
//var connectionstring = util.format('mongodb://%s:%s@%s:%d/%s',mongouser,mongopass,mongoip,mongoport,mongodb);
//
//
//mongoose.connection.on('error', function (err) {
//    console.error( err);
//});
//
//mongoose.connection.on('disconnected', function() {
//    console.error( new Error('Could not connect to database'));
//});
//
//mongoose.connection.once('open', function() {
//    console.log("Connected to db");
//});
//
//
//mongoose.connect(connectionstring);



var util = require('util');
var mongoip=config.Mongo.ip;
var mongoport=config.Mongo.port;
var mongodb=config.Mongo.dbname;
var mongouser=config.Mongo.user;
var mongopass = config.Mongo.password;
var mongoreplicaset= config.Mongo.replicaset;

var mongoose = require('mongoose');
var connectionstring = '';
mongoip = mongoip.split(',');
if(util.isArray(mongoip)){
     if(mongoip.length > 1){ 

    mongoip.forEach(function(item){
        connectionstring += util.format('%s:%d,',item,mongoport)
    });

    connectionstring = connectionstring.substring(0, connectionstring.length - 1);
    connectionstring = util.format('mongodb://%s:%s@%s/%s',mongouser,mongopass,connectionstring,mongodb);

    if(mongoreplicaset){
        connectionstring = util.format('%s?replicaSet=%s',connectionstring,mongoreplicaset) ;
    }
     }
    else
    {
         connectionstring = util.format('mongodb://%s:%s@%s:%d/%s',mongouser,mongopass,mongoip[0],mongoport,mongodb);
    }
}else{

    connectionstring = util.format('mongodb://%s:%s@%s:%d/%s',mongouser,mongopass,mongoip,mongoport,mongodb);
}

console.log(connectionstring);

mongoose.connect(connectionstring,{server:{auto_reconnect:true}});


mongoose.connection.on('error', function (err) {
    console.error( new Error(err));
    mongoose.disconnect();

});

mongoose.connection.on('opening', function() {
    console.log("reconnecting... %d", mongoose.connection.readyState);
});


mongoose.connection.on('disconnected', function() {
    console.error( 'Could not connect to database');
    mongoose.connect(connectionstring,{server:{auto_reconnect:true}});
});

mongoose.connection.once('open', function() {
    console.log("Connected to db");

});


mongoose.connection.on('reconnected', function () {
    console.log('MongoDB reconnected!');
});



process.on('SIGINT', function() {
    mongoose.connection.close(function () {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});

ards.RegisterChatArdsClient();
//ards.PickResource(1,103,"chat10", ["60"], "0", 1,"No");

//var messanger = config.Host.messenger;


//if(messanger == 'user'){

    var usermessanger = require('./Workers/UserMessenger');

//}else{

    var clientmessanger = require('./Workers/ExternalUserMessenger');
//}

