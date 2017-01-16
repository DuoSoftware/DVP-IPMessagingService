/**
 * Created by Sukitha on 1/10/2017.
 */

var util = require('util');
var config = require('config');
var uuid = require('node-uuid');
var port = config.Host.internalport || 3000;

////////////////////////////////redis////////////////////////////////////////
var redisip = config.Redis.ip;
var redisport = config.Redis.port;
var redisdb = config.Redis.db;
var redisuser = config.Redis.user;
var redispass = config.Redis.password;
////////////////////////////////////////////////////////////////////////////////

var io = require('socket.io')(port);
var redis = require('redis').createClient;
var adapter = require('socket.io-redis');
var socketioJwt =  require("socketio-jwt");
var secret = require('dvp-common/Authentication/Secret.js');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var User = require('dvp-mongomodels/model/User');
var PersonalMessage = require('dvp-mongomodels/model/Room').PersonalMessage;
var Room = require('dvp-mongomodels/model/Room').Room;
var Message = require('dvp-mongomodels/model/Room').Message


var pub = redis(redisport, redisip, { auth_pass: redispass });
var sub = redis(redisport, redisip, { auth_pass: redispass });
io.adapter(adapter({ pubClient: pub, subClient: sub }));


var redisClient = redis(redisport,redisip,{ auth_pass: redispass });
redisClient.select(redisdb, function() { logger.info("Redis Db selected " + redisdb);})


redisClient.on("error", function (err) {
    logger.error("Error ",  err);

});

redisClient.on("connected", function () {
    logger.info("Redis Connected ");


});

var SaveMessage = function(message){

    message.save(function (err, _message) {
        if (err) {

            logger.error('Save message failed ',err);

        } else{

            if(_message){

                logger.info("Message saved ");

            }else{

                logger.error('Save message failed ',err);
            }
        }
    });
};

var UpdateRead = function(uuid){

    PersonalMessage.findOneAndUpdate({uuid:uuid},{status:'seen'},function (err, _message) {
        if (err) {

            logger.error('Update seen message failed ',err);

        } else{

            if(_message){

                logger.info("Update seen saved ");

            }else{

                logger.error('Update seen message failed ',err);
            }
        }
    });
};

io.sockets.on('connection',socketioJwt.authorize({secret:  secret.Secret, timeout: 15000})).on('authenticated',function (socket) {

    logger.info('hello! ' + socket.decoded_token.iss);

    redisClient.set(util.format("%s:messaging:time",socket.decoded_token.iss),Date.now().toString(),redis.print);

   // logger.info(socket.handshake);

    socket.join(socket.decoded_token.iss);
    var statusGroup = util.format("%d:%d:messaging:status",socket.decoded_token.tenant,socket.decoded_token.company);
    socket.join(statusGroup);

    var fromRedisKey = util.format("%s:messaging:status", socket.decoded_token.iss);
    var onlineUsers = util.format("%d:%d:users:online",socket.decoded_token.tenant,socket.decoded_token.company);

    redisClient.get(fromRedisKey, function (errGet, resGet) {
        if (errGet) {
            logger.error('No user status found in redis', errGet);
        } else {

            if (!resGet) {

                logger.error('No user status found in redis', errGet);
            } else {

                io.to(statusGroup).emit("status", resGet);
                redisClient.hset(onlineUsers, socket.decoded_token.iss, resGet, redis.print);
            }
        }
    });

    redisClient.hgetall(onlineUsers, function (err, obj) {
        if(err){
            logger.error('No users status found in redis', err);
        }else{

            if(obj) {
                io.to(socket.decoded_token.iss).emit("status", JSON.parse(obj));
            }else{

                logger.error('No users status found in redis');
            }
        }
    });

    socket.on('message',function(data){

        if(data && data.to && data.message && data.type &&  data.id) {

            logger.info(data);
            //io.to(socket.decoded_token.iss).emit('echo', data);
            data.from = socket.decoded_token.iss;
            data.time = Date.now();
            var id = data.id;//uuid.v1();

            var toRedisKey = util.format("%s:messaging:status", data.to);

            var message = PersonalMessage({

                type: data.type,
                created_at: Date.now(),
                updated_at: Date.now(),
                status: 'pending',
                uuid: id,
                data:  data.message,
                from: socket.decoded_token.iss,
                to: data.to

            });

            io.sockets.adapter.clients( [data.to], function (err, clients) {
                if (err) {
                    socket.emit('event', {event: 'message_status', id: id, data: 'nouser'});
                    logger.error('No user available in room',err);
                    SaveMessage(message);

                }else{
                    if(Array.isArray(clients) && clients.length > 0) {


                        data.id = id;
                        io.to(data.to).emit("message", data);
                        socket.emit('event', {event: 'message_status', id: id, data: 'delivered'});
                        message.status = 'delivered';

                        SaveMessage(message);

                    }else{

                        socket.emit('event', {event: 'message_status', id: id, data: 'nouser'});
                        logger.error('No user available in room');
                        SaveMessage(message);
                    }
                }
            });

        }

    });

    socket.on('status',function(data){

        if(data && data.presence) {

            var statusGroup = util.format("%d:%d:messaging:status",socket.decoded_token.tenant,socket.decoded_token.company);
            redisClient.set(util.format("%s:messaging:status", socket.decoded_token.iss), data.presence, redis.print);
            var statusObj = {};
            statusObj[socket.decoded_token.iss] = data.presence;
            io.to(statusGroup).emit("status", statusObj);

            var onlineUsers = util.format("%d:%d:users:online",socket.decoded_token.tenant,socket.decoded_token.company);
            redisClient.hset(onlineUsers, socket.decoded_token.iss, data.presence, redis.print);

        }else{

            socket.emit('error',{action:'status', message: 'incorrect data'});
        }

    });

    socket.on('accept',function(data) {

        if (data && data.to) {


            User.findOne({
                    company: socket.decoded_token.company,
                    tenant: socket.decoded_token.tenant,
                    username: socket.decoded_token.iss
                })
                .select("username name avatar")
                .exec(function (err, user) {
                    if (err) {


                    } else {

                        if (user) {

                            io.to(data.to).emit("agent", {username: user.username, name : user.name, avatar: user.avatar});

                        } else {

                        }
                    }

                });
        }

    });

    socket.on('typing',function(data){

        if(data && data.to)
            io.to(data.to).emit("typing", data);

    });

    socket.on('typingstoped',function(data){

        if(data && data.to)
            io.to(data.to).emit("typingstoped", data);

    });

    socket.on('request',function(data){

        switch(data.request){
            case 'allstatus':

                redisClient.hgetall(onlineUsers, function (err, obj) {
                    if(err){
                        logger.error('No users status found in redis', err);
                    }else{

                        if(obj) {
                            io.to(socket.decoded_token.iss).emit("status", obj);
                        }else{

                            logger.error('No users status found in redis');
                        }
                    }
                });

                break;


        }

    });

    socket.on('event',function(data){

        logger.info(data);

    });

    socket.on('seen',function(data){

        if(data && data.to && data.id) {
            io.to(data.to).emit("seen", data);
            UpdateRead(data.id);
        }
    });

    socket.on('disconnect', function(){

        //var statusGroup = util.format("%d:%d:messaging:status",socket.decoded_token.tenant,socket.decoded_token.company);
        //redisClient.del(util.format("%s:messaging:status", socket.decoded_token.iss), redis.print);
        io.to(statusGroup).emit("status", 'offline');

        var onlineUsers = util.format("%d:%d:users:online",socket.decoded_token.tenant,socket.decoded_token.company);
        //redisClient.hdel(onlineUsers, socket.decoded_token.iss, redis.print);
        redisClient.hset(onlineUsers, socket.decoded_token.iss, 'offline', redis.print);

        redisClient.set(util.format("%s:messaging:lastseen", socket.decoded_token.iss), Date.now(), redis.print);
    });

    PersonalMessage.find({to: socket.decoded_token.iss, status: 'pending'}, function (err, messages) {
        if (err) {

            logger.error('Get personal messages failed',err);
        }
        else {
            if(Array.isArray(messages) && messages.length > 0) {

                messages.forEach(function(message){

                    var _message = {
                        from:message.from,
                        to:message.to,
                        message: message.data,
                        id: message.uuid
                    };

                    io.to(message.to).emit("message", _message);
                    message.status = 'delivered';

                    SaveMessage(message);


                });
            }
        }
    });


});
