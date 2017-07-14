/**
 * Created by Sukitha on 1/10/2017.
 */
"use strict";
var util = require('util');
var config = require('config');
var uuid = require('node-uuid');
var port = config.Host.internalport || 3000;



var io = require('socket.io')(port);
var redis = require('ioredis');
var adapter = require('socket.io-redis');
//var adapter = require('socket.io-ioredis');
var socketioJwt =  require("socketio-jwt");
var secret = require('dvp-common/Authentication/Secret.js');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var User = require('dvp-mongomodels/model/User');
var PersonalMessage = require('dvp-mongomodels/model/Room').PersonalMessage;
var Room = require('dvp-mongomodels/model/Room').Room;
var Message = require('dvp-mongomodels/model/Room').Message;
var ards = require('./Ards');




var redisip = config.Redis.ip;
var redisport = config.Redis.port;
var redispass = config.Redis.password;
var redismode = config.Redis.mode;
var redisdb = config.Redis.db;



var redisSetting =  {
    port:redisport,
    host:redisip,
    family: 4,
    password: redispass,
    db: redisdb,
    retryStrategy: function (times) {
        var delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError: function (err) {

        return true;
    }
};



if(redismode == 'sentinel'){

    if(config.Redis.sentinels && config.Redis.sentinels.hosts && config.Redis.sentinels.port, config.Redis.sentinels.name){
        var sentinelHosts = config.Redis.sentinels.hosts.split(',');
        if(Array.isArray(sentinelHosts) && sentinelHosts.length > 2){
            var sentinelConnections = [];

            sentinelHosts.forEach(function(item){

                sentinelConnections.push({host: item, port:config.Redis.sentinels.port})

            })

            redisSetting = {
                sentinels:sentinelConnections,
                name: config.Redis.sentinels.name,
                password: redispass
            }

        }else{

            console.log("No enough sentinel servers found .........");
        }

    }
}

var redisClient = undefined;
var  pubclient = undefined;
var subclient = undefined;

if(redismode != "cluster") {
    redisClient = new redis(redisSetting);
    pubclient = new redis(redisSetting);
    subclient = new redis(redisSetting);
}else{

    var redisHosts = redisip.split(",");
    if(Array.isArray(redisHosts)){


        redisSetting = [];
        redisHosts.forEach(function(item){
            redisSetting.push({
                host: item,
                port: redisport,
                family: 4,
                password: redispass});
        });

        redisClient = new redis.Cluster([redisSetting]);
        pubclient = new redis.Cluster([redisSetting]);
        subclient = new redis.Cluster([redisSetting]);

    }else{

        redisClient = new redis(redisSetting);
        pubclient = redis(redisSetting);
        subclient = redis(redisSetting);
    }


}



//var pub = redis(redisport, redisip, { auth_pass: redispass });
//var sub = redis(redisport, redisip, { auth_pass: redispass });
io.adapter(adapter({ pubClient: pubclient, subClient: subclient}));




redisClient.on("error", function (err) {
    logger.error("Error ",  err);

});

redisClient.on("node error", function (err) {
    logger.error("Error ",  err);

});

redisClient.on("connect", function () {
    logger.info("Redis Connected ");
});

pubclient.on("error", function (err) {
    logger.error("Error ",  err);
});


pubclient.on("error", function (err) {
    logger.error("Error ",  err);
});
subclient.on("node error", function (err) {
    logger.error("Error ",  err);
});

pubclient.on("node error", function (err) {
    logger.error("Error ",  err);
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

io.sockets.on('connection',
    socketioJwt.authorize({secret:  secret.Secret, timeout: 15000}))
    .on('authenticated',function (socket) {


        socket.join(socket.decoded_token.iss);
        logger.info("Joining to the room "+socket.decoded_token.iss);

        logger.info('hello! ' + socket.decoded_token.iss);

        redisClient.set(util.format("%s:messaging:time", socket.decoded_token.iss), Date.now().toString(), redis.print);

        console.log(socket.decoded_token.iss);


        var statusGroup = util.format("%d:%d:messaging:status", socket.decoded_token.tenant, socket.decoded_token.company);
        socket.join(statusGroup);

        var fromRedisKey = util.format("%s:messaging:status", socket.decoded_token.iss);
        var onlineUsers = util.format("%d:%d:users:online", socket.decoded_token.tenant, socket.decoded_token.company);


        redisClient.get(fromRedisKey, function (errGet, resGet) {
            if (errGet) {
                logger.error('No user status found in redis', errGet);
            } else {

                if (!resGet) {

                    logger.error('No user status found in redis');

                } else {

                    var statusObg = {};
                    statusObg[socket.decoded_token.iss] = resGet;

                    //if(statusObg)
                    io.to(statusGroup).emit("status", statusObg);
                    redisClient.hset(onlineUsers, socket.decoded_token.iss, resGet, redis.print);

                    ards.GetOngoingSessions(socket.decoded_token.tenant, socket.decoded_token.company, socket.decoded_token.context.resourceid, function (err, ongoinSessions) {
                        if (ongoinSessions && ongoinSessions.length > 0) {
                            ongoinSessions.forEach(function (session) {


                                var onlineclients = util.format("%d:%d:client:online:%s", socket.decoded_token.tenant, socket.decoded_token.company, session);
                                redisClient.get(onlineclients, function (err, strObj) {

                                    if (strObj) {

                                        var obj = JSON.parse(strObj);
                                        socket.emit("existingclient", obj);
                                    }

                                });

                            });
                        }
                    });
                }
            }
        });



        redisClient.hgetall(onlineUsers, function (err, obj) {
            if (err) {
                logger.error('No users status found in redis', err);
            } else {

                if (obj) {
                    io.to(socket.decoded_token.iss).emit("status", obj);
                } else {

                    logger.error('No users status found in redis');
                }
            }
        });

        socket.on('connect', function (data) {


            redisClient.get(fromRedisKey, function (errGet, resGet) {
                if (errGet) {
                    logger.error('No user status found in redis', errGet);
                } else {

                    if (!resGet) {

                        logger.error('No user status found in redis');

                    } else {

                        var statusObg = {};
                        statusObg[socket.decoded_token.iss] = resGet;

                        io.to(statusGroup).emit("status", statusObg);
                        redisClient.hset(onlineUsers, socket.decoded_token.iss, resGet, redis.print);

                    }
                }
            });

        });

        socket.on('message', function (data) {

            if (data && data.to && data.message && data.type && data.id) {

                logger.info(data);
                //io.to(socket.decoded_token.iss).emit('echo', data);
                data.from = socket.decoded_token.iss;
                data.time = Date.now();
                data.uuid = data.id;
                data.status = 'pending';
                var id = data.id;//uuid.v1();

                var toRedisKey = util.format("%s:messaging:status", data.to);

                var message = PersonalMessage({

                    type: data.type,
                    created_at: Date.now(),
                    updated_at: Date.now(),
                    status: 'pending',
                    uuid: id,
                    data: data.message,
                    from: socket.decoded_token.iss,
                    to: data.to

                });

                io.sockets.adapter.clients([data.to], function (err, clients) {
                    if (err) {
                        socket.emit('seen', {from: data.to, to: socket.decoded_token.iss, id: id, status: 'nouser'});
                        io.to(data.to).emit("message", data);
                        logger.error('No user available in room', err);
                        SaveMessage(message);

                    } else {
                        if (Array.isArray(clients) && clients.length > 0) {


                            data.status = 'delivered';
                            data.id = id;
                            io.to(data.to).emit("message", data);
                            socket.emit('seen', {
                                from: data.to,
                                to: socket.decoded_token.iss,
                                id: id,
                                status: 'delivered'
                            });
                            message.status = 'delivered';

                            SaveMessage(message);

                        } else {

                            socket.emit('seen', {
                                from: data.to,
                                to: socket.decoded_token.iss,
                                id: id,
                                status: 'nouser'
                            });
                            logger.error('No user available in room \n');
                            SaveMessage(message);
                        }
                    }
                });

            }

        });

        socket.on('status', function (data) {

            if (data && data.presence) {

                var statusGroup = util.format("%d:%d:messaging:status", socket.decoded_token.tenant, socket.decoded_token.company);

                var statusKey = util.format("%s:messaging:status", socket.decoded_token.iss);

                if (data.presence_type === 'call') {
                    statusKey = util.format("%s:%s:status", socket.decoded_token.iss, data.presence_type);
                }

                redisClient.set(statusKey, data.presence, redis.print);
                var statusObj = {};


                statusObj[socket.decoded_token.iss] = data.presence;

                if (data.presence_type == 'call') {
                    io.to(statusGroup).emit("callstatus", statusObj);
                    var onlineUsersStatus = util.format("%d:%d:%susers:online", socket.decoded_token.tenant, socket.decoded_token.company, data.presence_type);
                    redisClient.hset(onlineUsersStatus, socket.decoded_token.iss, data.presence, redis.print);

                } else {
                    io.to(statusGroup).emit("status", statusObj);
                    var onlineUsers = util.format("%d:%d:users:online", socket.decoded_token.tenant, socket.decoded_token.company);
                    redisClient.hset(onlineUsers, socket.decoded_token.iss, data.presence, redis.print);
                }


            } else {

                socket.emit('connectionerror', {action: 'status', message: 'incorrect data'});
            }

        });

        socket.on('accept', function (data) {

            if (data && data.to) {


                User.findOne({
                        company: socket.decoded_token.company,
                        tenant: socket.decoded_token.tenant,
                        username: socket.decoded_token.iss
                    })
                    .select("username name avatar firstname lastname")
                    .exec(function (err, user) {
                        if (err) {


                        } else {

                            if (user) {

                                var agentData = {
                                    username: user.username,
                                    name: user.firstname + "" + user.lastname,
                                    id: user.id,
                                    avatar: user.avatar
                                };

                                if (data.profile) {

                                    agentData.client = data.profile;
                                }

                                io.to(data.to).emit("agent", agentData);
                                var client_data = socket.decoded_token;
                                //socket.clientjti = data.to;
                                ards.UpdateResource(client_data.tenant, client_data.company, data.to, client_data.context.resourceid, 'Connected', '', '', 'inbound');


                                var onlineClientsUsers = util.format("%d:%d:client:online:%s", client_data.tenant, client_data.company, data.jti);
                                data.agent = socket.decoded_token.iss;
                                data.agentdata = agentData;
                                var jsonData = JSON.stringify(data);
                                redisClient.set(onlineClientsUsers, jsonData, redis.print);


                                var message = PersonalMessage({

                                    type: "accept",
                                    created_at: Date.now(),
                                    updated_at: Date.now(),
                                    status: 'delivered',
                                    uuid: uuid.v4(),
                                    data: user.username,
                                    from: socket.decoded_token.iss,
                                    to: data.to

                                });

                                SaveMessage(message);

                            } else {

                            }
                        }

                    });
            }

        });

        socket.on('reject', function (data) {

            if (data && data.to) {
                var client_data = socket.decoded_token;
                io.to(data.to).emit("agent_rejected", client_data);
            }

        });

        socket.on('ticket', function (data) {

                io.to(data.to).emit("ticket", data);

        });

        socket.on('sessionend', function (data) {

            if (data && data.to) {
                var client_data = socket.decoded_token;
                io.to(data.to).emit("left", client_data);

                var message = PersonalMessage({

                    type: "end",
                    created_at: Date.now(),
                    updated_at: Date.now(),
                    status: 'delivered',
                    uuid: uuid.v4(),
                    data: data.message,
                    from: socket.decoded_token.iss,
                    to: data.to

                });

                SaveMessage(message);


                ards.UpdateResource(client_data.tenant, client_data.company, data.to, client_data.context.resourceid, 'Completed', '', '', 'inbound');

                var onlineClientsUsers = util.format("%d:%d:client:online:%s", client_data.tenant, client_data.company, data.to);
                redisClient.del(onlineClientsUsers, redis.print);
            }
        });


        socket.on('tag', function (data) {

            if (data && data.to) {
                var client_data = socket.decoded_token;
                //io.to(data.to).emit("left", client_data);

                var message = PersonalMessage({

                    type: "tag",
                    created_at: Date.now(),
                    updated_at: Date.now(),
                    status: 'delivered',
                    uuid: uuid.v4(),
                    data: data.message,
                    from: socket.decoded_token.iss,
                    to: data.to

                });

                SaveMessage(message);


                //ards.UpdateResource(client_data.tenant, client_data.company, data.to, client_data.context.resourceid, 'Completed', '', '', 'inbound');

                //var onlineClientsUsers = util.format("%d:%d:client:online:%s", client_data.tenant, client_data.company, data.to);
                //redisClient.del(onlineClientsUsers, redis.print);
            }
        });



        socket.on('typing', function (data) {

            if (data && data.to) {
                data.from = socket.decoded_token.iss;
                io.to(data.to).emit("typing", data);
            }

        });

        socket.on('typingstoped', function (data) {

            if (data && data.to) {
                data.from = socket.decoded_token.iss;
                io.to(data.to).emit("typingstoped", data);
            }

        });

        socket.on('request', function (data) {

            switch (data.request) {
                case 'allstatus':
                    redisClient.hgetall(onlineUsers, function (err, obj) {
                        if (err) {
                            logger.error('No users status found in redis', err);
                        } else {

                            if (obj) {
                                socket.emit("status", obj);
                            } else {

                                logger.error('No users status found in redis');
                                socket.emit('error', {action: 'allstatus', message: 'no data found'});
                            }
                        }
                    });

                    break;

                //
                case 'allcallstatus':


                    var onlineUsersStatus = util.format("%d:%d:callusers:online", socket.decoded_token.tenant, socket.decoded_token.company);

                    redisClient.hgetall(onlineUsersStatus, function (err, obj) {
                        if (err) {
                            logger.error('No users status found in redis', err);
                        } else {

                            if (obj) {
                                socket.emit("callstatus", obj);
                            } else {

                                logger.error('No users status found in redis');
                                socket.emit('error', {action: 'allcallstatus', message: 'no data found'});
                            }
                        }
                    });


                    break;

                case 'chatstatus':

                    var keys = [];
                    keys.push(util.format("%s:messaging:status", data.from));
                    keys.push(util.format("%s:messaging:time", data.from));
                    keys.push(util.format("%s:messaging:lastseen", data.from));
                    redisClient.mget(keys, function (err, obj) {
                        if (err) {
                            logger.error('No users status found in redis', err);
                        } else {

                            if (obj && Array.isArray(obj) && obj.length > 2) {

                                var useChatObj = {};
                                useChatObj.from = data.from;
                                useChatObj.status = obj[0];
                                useChatObj.time = obj[1];
                                useChatObj.lastseen = obj[2];

                                socket.emit("chatstatus", useChatObj);
                            } else {

                                logger.error('No users status found in redis');
                                socket.emit('error', {action: 'status', message: 'no data found'});
                            }
                        }
                    });

                    break;

                case 'oldmessages':

                    var requester = data.requester;
                    var from = data.from;
                    var to = data.to;
                    var id = data.id;

                    var customer = (requester === from) ? from : to;

                    PersonalMessage.findOne({from: from, to: to, uuid: id}, function (err, obj) {

                        var query = {
                            created_at: {$lt: obj.created_at},
                            $or: [{from: from, to: to}, {from: to, to: from}]
                        };

                        if(data.who && data.who === "client"){
                            query = {
                                created_at: {$lt: obj.created_at},
                                $or: [{from: customer}, {to: customer}]
                            };
                        }

                        //{
                        //    created_at: {$lt: obj.created_at},
                        //    $or: [{from: from, to: to}, {from: to, to: from}]
                        //}
                        if (obj) {

                            PersonalMessage.find(query).sort({created_at: -1}).limit(100)
                                .exec(function (err, oldmessages) {

                                    if (oldmessages) {
                                        socket.emit("oldmessages", {from:requester, messages:oldmessages});
                                    } else {

                                        logger.error('No old message found');
                                        socket.emit('connectionerror', {
                                            action: 'oldmessages',
                                            from:requester,
                                            data: data,
                                            message: 'no data found'
                                        });
                                    }
                                })
                        }
                    });

                    break;

                case 'newmessages':

                    var from = data.from;
                    var to = data.to;
                    var id = data.id;
                    var customer = (requester === from) ? from : to;

                    PersonalMessage.findOne({from: from, to: to, uuid: id}, function (err, obj) {

                        if (obj) {


                            var query = {
                                created_at: {$gt: obj.created_at},
                                $or: [{from: from, to: to}, {from: to, to: from}]
                            };

                            if(data.who && data.who === "client"){
                                query = {
                                    created_at: {$gt: obj.created_at},
                                    $or: [{from: customer}, {to: customer}]
                                };
                            }

                            //created_at: {$gt: obj.created_at},
                            //$or: [{from: from, to: to}, {from: to, to: from}]

                            PersonalMessage.find(query).sort({created_at: 1}).limit(100)
                                .exec(function (err, newmessages) {

                                    if (data) {
                                        io.to(socket.decoded_token.iss).emit("newmessages", newmessages);
                                    } else {
                                        logger.error('No new message found');
                                        socket.emit('connectionerror', {
                                            action: 'newmessages',
                                            data: data,
                                            message: 'no data found'
                                        });
                                    }
                                })
                        }
                    });

                    break;


                case 'tags':

                    var from = data.from;
                    var to = socket.decoded_token.iss;

                    PersonalMessage.find({to: from, type: 'tag'}, function (err, data) {



                        if (data) {

                            var reply = {};
                            reply.from = from;
                            reply.to = to;
                            reply.tags = data;
                            io.to(socket.decoded_token.iss).emit("tags", reply);
                        } else {
                            logger.error('No tags found');
                            socket.emit('connectionerror', {
                                action: 'tags',
                                data: data,
                                message: 'no data found'
                            });
                        }


                    });

                    break;


                case 'latestmessages':

                    var from = data.from;
                    var to = socket.decoded_token.iss;
                    //var id = data.uuid;

                    var query = {
                        $or: [{from: from, to: to}, {from: to, to: from}]
                    };

                    if(data.who && data.who === "client"){

                        query = {
                            $or: [{from: from}, {to: from}]
                        };
                    }

                    PersonalMessage.find(query).sort({created_at: -1}).limit(100)
                        .exec(function (err, latestmessages) {

                            if (latestmessages && Array.isArray(latestmessages)) {
                                io.to(socket.decoded_token.iss).emit("latestmessages", {
                                    from: data.from,
                                    messages: latestmessages.reverse()
                                });
                            } else {
                                logger.error('No new message found');
                                socket.emit('connectionerror', {
                                    action: 'latestmessages',
                                    data: data,
                                    message: 'no data found'
                                });
                            }
                        });

                    break;

                case 'pendingall':

                    var queryObject = {to: socket.decoded_token.iss, status: 'pending'};

                    var aggregator = [{
                        $match: queryObject
                    }, {
                        $group: {
                            _id: "$from",
                            messages: {$sum: 1}
                        }
                    }
                    ];

                    PersonalMessage.aggregate(aggregator, function (err, messages) {
                        if (err) {

                            logger.error('Get personal messages failed', err);
                        }
                        else {
                            if (messages) {

                                io.to(socket.decoded_token.iss).emit("pending", messages);
                            }
                        }
                    });

                    break;

            }

        });

        socket.on('event', function (data) {

            logger.info(data);

        });

        socket.on('seen', function (data) {

            if (data && data.to && data.id) {
                data.from = socket.decoded_token.iss;
                data.status = 'seen';
                io.to(data.to).emit("seen", data);
                UpdateRead(data.id);
            }
        });

        socket.on('disconnect', function (reason) {


            console.log("Bye " + socket.decoded_token.iss + " Reason: "+reason);
            io.sockets.adapter.clients([ socket.decoded_token.iss], function (err, clients) {
                if (err) {

                    logger.error('No user available in room :', err);
                    var statusObg = {};
                    statusObg[socket.decoded_token.iss] = 'offline';
                    io.to(statusGroup).emit("status", statusObg);
                    var onlineUsers = util.format("%d:%d:users:online", socket.decoded_token.tenant, socket.decoded_token.company);
                    redisClient.hset(onlineUsers, socket.decoded_token.iss, 'offline', redis.print);
                    redisClient.set(util.format("%s:messaging:lastseen", socket.decoded_token.iss), Date.now(), redis.print);


                } else {
                    if (Array.isArray(clients) && clients.length > 0) {

                        logger.info("There are users available so keeping user online");

                    } else {


                        logger.debug('No user available in room');

                        var statusObg = {};
                        statusObg[socket.decoded_token.iss] = 'offline';
                        io.to(statusGroup).emit("status", statusObg);
                        var onlineUsers = util.format("%d:%d:users:online", socket.decoded_token.tenant, socket.decoded_token.company);
                        redisClient.hset(onlineUsers, socket.decoded_token.iss, 'offline', redis.print);
                        redisClient.set(util.format("%s:messaging:lastseen", socket.decoded_token.iss), Date.now(), redis.print);

                    }
                }
            });

        });

        socket.on('subscribe', function(data){

            //queue:details
            if(data && data.room){

                var uniqueRoom = util.format('%d:%d:subscribe:%s', socket.decoded_token.tenant, socket.decoded_token.company,data.room)
                socket.join(uniqueRoom);

            }else{
                socket.emit('error', {action: 'subscribe', message: 'no data found'});
            }

        });


        socket.on('unsubscribe', function(data){

            if(data && data.room){

                var uniqueRoom = util.format('%d:%d:subscribe:%s', socket.decoded_token.tenant, socket.decoded_token.company,data.room)
                socket.leave(uniqueRoom);

            }else{
                socket.emit('error', {action: 'subscribe', message: 'no data found'});
            }

        });


        var queryObject = {to: socket.decoded_token.iss, status: 'pending'};

        var aggregator = [{
            $match: queryObject
        }, {
            $group: {
                _id: "$from",
                messages: {$sum: 1}
            }
        }
        ];

        PersonalMessage.aggregate(aggregator, function (err, messages) {
            if (err) {

                logger.error('Get personal messages failed', err);
            }
            else {
                if (messages) {

                    io.to(socket.decoded_token.iss).emit("pending", messages);
                }
            }
        });


        /*
         PersonalMessage.find(queryObject, function (err, messages) {
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

         */


    });
