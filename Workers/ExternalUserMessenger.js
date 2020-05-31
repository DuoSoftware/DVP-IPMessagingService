/**
 * Created by Sukitha on 1/10/2017.
 */

var util = require('util');
var config = require('config');
var uuid = require('node-uuid');
var port = config.Host.externalport || 4000;


var io = require('socket.io')(port);
var redis = require('ioredis');
var adapter = require('socket.io-redis');
//var adapter = require('socket.io-ioredis');
var socketioJwt = require("socketio-jwt");
var secret = require('dvp-common-lite/Authentication/Secret.js');
var logger = require('dvp-common-lite/LogHandler/CommonLogHandler.js').logger;
var PersonalMessage = require('dvp-mongomodels/model/Room').PersonalMessage;
var Room = require('dvp-mongomodels/model/Room').Room;
var Message = require('dvp-mongomodels/model/Room').Message;
var Common = require('./Common.js');
var ards = require('./Ards');
var crypto_handler = require('./crypto_handler.js');


var redisip = config.Redis.ip;
var redisport = config.Redis.port;
var redispass = config.Redis.password;
var redismode = config.Redis.mode;
var redisdb = config.Redis.db;


var redisSetting = {
    port: redisport,
    host: redisip,
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

if (redismode == 'sentinel') {

    if (config.Redis.sentinels && config.Redis.sentinels.hosts && config.Redis.sentinels.port && config.Redis.sentinels.name) {
        var sentinelHosts = config.Redis.sentinels.hosts.split(',');
        if (Array.isArray(sentinelHosts) && sentinelHosts.length > 2) {
            var sentinelConnections = [];

            sentinelHosts.forEach(function (item) {

                sentinelConnections.push({host: item, port: config.Redis.sentinels.port})

            })

            redisSetting = {
                sentinels: sentinelConnections,
                name: config.Redis.sentinels.name,
                password: redispass
            }

        } else {

            console.log("No enough sentinel servers found .........");
        }

    }
}

var redisClient = undefined;
var pubclient = undefined;
var subclient = undefined;

if (redismode != "cluster") {
    redisClient = new redis(redisSetting);
    pubclient = new redis(redisSetting);
    subclient = new redis(redisSetting);
} else {

    var redisHosts = redisip.split(",");
    if (Array.isArray(redisHosts)) {


        redisSetting = [];
        redisHosts.forEach(function (item) {
            redisSetting.push({
                host: item,
                port: redisport,
                family: 4,
                password: redispass
            });
        });

        redisClient = new redis.Cluster([redisSetting]);
        pubclient = new redis.Cluster([redisSetting]);
        subclient = new redis.Cluster([redisSetting]);

    } else {

        redisClient = new redis(redisSetting);
        pubclient = new redis(redisSetting);
        subclient = new redis(redisSetting);
    }
}


//var pub = redis(redisport, redisip, { auth_pass: redispass });
//var sub = redis(redisport, redisip, { auth_pass: redispass });
io.adapter(adapter({pubClient: pubclient, subClient: subclient}));


redisClient.on("error", function (err) {
    logger.error("Error ", err);
});

redisClient.on("node error", function (err) {
    logger.error("Error ", err);
});

redisClient.on("connect", function () {
    logger.info("Redis Connected ");
});


pubclient.on("error", function (err) {
    logger.error("Error ", err);
});

subclient.on("error", function (err) {
    logger.error("Error ", err);
});
pubclient.on("node error", function (err) {
    logger.error("Error ", err);
});

subclient.on("node error", function (err) {
    logger.error("Error ", err);
});

//////////////////////////////save before send might be a good idea////////////////////
var SaveMessage = function (message) {

    var e_text = crypto_handler.Encrypt(message.data);
    message._doc.data = e_text;
    message.save(function (err, _message) {
        if (err) {

            logger.error('Save message failed ', err);

        } else {

            if (_message) {

                logger.info("Message saved ");

            } else {

                logger.error('Save message failed ', err);
            }
        }
    });
};

var UpdateRead = function (uuid) {

    PersonalMessage.findOneAndUpdate({uuid: uuid}, {status: 'seen'}, function (err, _message) {
        if (err) {

            logger.error('Update seen message failed ', err);

        } else {

            if (_message) {

                logger.info("Update seen saved ");

            } else {

                logger.error('Update seen message failed ', err);
            }
        }
    });
};


io.sockets.on('connection', socketioJwt.authorize({
    secret: Common.CompanyChatSecret,
    timeout: 15000
})).on('authenticated', function (socket) {

    logger.info('hello! ' + socket.decoded_token.iss);

    socket.join(socket.decoded_token.jti);
    ///////////////////////////////////////////ARDS Integration////////////////////////////////////////////////////


    var status = 'setup';
    var client_data = socket.decoded_token;
    var otherInfo = "";
    socket.message_buffer = [];


    var onlineClientsUsers = util.format("%d:%d:client:online:%s", client_data.tenant, client_data.company, client_data.jti);
    var messageBufferKey = util.format("%d:%d:client:buffer:%s", client_data.tenant, client_data.company, client_data.jti);


    Common.CreateEngagement(socket.decoded_token, function (error, profile) {

        redisClient.get(onlineClientsUsers, function (err, strObj) {
            if (strObj) {
                var obj = JSON.parse(strObj);
                socket.agent = obj.agent;
                io.in(obj.agent).emit("existingclient", client_data);
                socket.emit("existingagent", obj.agentdata);
            } else {

                ards.PickResource(client_data.tenant, client_data.company, client_data.jti, client_data.attributes, client_data.priority, 1, otherInfo, function (err, resource) {

                    if (resource && resource.ResourceInfo) {


                        var agent = resource.ResourceInfo.Profile;
                        socket.agent = agent;
                        console.log("Agent is " + agent);

                        client_data.profile = profile;
                        socket.profile = profile;
                        client_data.Skills=resource.Skills;
                        io.in(agent).emit("client", client_data);

                    } else {

                        socket.emit('connectionerror', 'no_agent_found');
                    }
                });

            }
        });

        //var agent = 'sukitha';
        //socket.agent = agent;
        //io.to(agent).emit("client", client_data);

        //////////////////////////////////////////////////////////////////////////////////////////////////////////////


    });

    socket.on('message', function (data) {

        if (data && data.message && data.type) {

            // var onlineClientsUsers = util.format("%d:%d:client:online:%s", client_data.tenant, client_data.company, data.jti);
            // data.agent = socket.decoded_token.iss;
            // data.agentdata = agentData;
            // var jsonData = JSON.stringify(data);
            // redisClient.set(onlineClientsUsers, jsonData, redis.print);
            //

            redisClient.get(onlineClientsUsers, function (err, strObj) {
                if (strObj) {
                    const obj = JSON.parse(strObj);
                    socket.agent = obj.agent;
                    logger.info(data);
                    //io.to(socket.decoded_token.iss).emit('echo', data);
                    data.from = socket.decoded_token.jti;
                    data.display = socket.decoded_token.name;
                    data.time = Date.now();
                    data.to = socket.agent;
                    data.who = 'client';

                    var id = uuid.v1();
                    if (data.id)
                        id = data.id;


                    //var toRedisKey = util.format("%s:messaging:status", data.to);

                    var message = PersonalMessage({

                        type: data.type,
                        created_at: Date.now(),
                        updated_at: Date.now(),
                        status: 'pending',
                        uuid: id,
                        data: data.message,
                        session: socket.decoded_token.sessionId || socket.decoded_token.jti,
                        from: socket.decoded_token.name || socket.decoded_token.jti,
                        to: data.to

                    });

                    console.log(data);
                    io.sockets.adapter.clients([data.to], function (err, clients) {
                        if (err) {
                            logger.error('No user available in room', err);
                            io.in(data.to).emit("message", data);
                            SaveMessage(message);

                        } else {
                            if (Array.isArray(clients) && clients.length > 0) {


                                data.id = id;
                                io.in(data.to).emit("message", data);
                                message.status = 'delivered';

                                SaveMessage(message);


                            } else {
                                socket.emit('connectionerror', 'no_agent_found');
                                logger.error('No user available in room');
                                SaveMessage(message);
                            }
                        }
                    });
                } else {

                    socket.message_buffer.push(data);
                    redisClient.rpush(messageBufferKey, JSON.stringify(data), redis.print);

                }
            });

            // if(socket.agent ){
            //
            //     logger.info(data);
            //     //io.to(socket.decoded_token.iss).emit('echo', data);
            //     data.from = socket.decoded_token.jti;
            //     data.display = socket.decoded_token.name;
            //     data.time = Date.now();
            //     data.to = socket.agent;
            //     data.who = 'client';
            //
            //     var id = uuid.v1();
            //     if (data.id)
            //         id = data.id;
            //
            //
            //     var toRedisKey = util.format("%s:messaging:status", data.to);
            //
            //     var message = PersonalMessage({
            //
            //         type: data.type,
            //         created_at: Date.now(),
            //         updated_at: Date.now(),
            //         status: 'pending',
            //         uuid: id,
            //         data: data.message,
            //         session: socket.decoded_token.jti,
            //         from: socket.decoded_token.jti,
            //         to: data.to
            //
            //     });
            //
            //
            //
            //     console.log(data);
            //     io.sockets.adapter.clients([data.to], function (err, clients) {
            //         if (err) {
            //             logger.error('No user available in room', err);
            //             io.in(data.to).emit("message", data);
            //             SaveMessage(message);
            //
            //         } else {
            //             if (Array.isArray(clients) && clients.length > 0) {
            //
            //
            //                 data.id = id;
            //                 io.in(data.to).emit("message", data);
            //                 message.status = 'delivered';
            //
            //                 SaveMessage(message);
            //
            //
            //             } else {
            //                 socket.emit('connectionerror', 'no_agent_found');
            //                 logger.error('No user available in room');
            //                 SaveMessage(message);
            //             }
            //         }
            //     });
            //
            // }else{
            //
            //     socket.message_buffer.push(data);
            // }
        } else {
            socket.emit('connectionerror', 'message_error');

        }

    });

    socket.on('typing', function (data) {


        if (data && socket.agent) {
            data.from = socket.decoded_token.jti;
            io.in(socket.agent).emit("typing", data);
        }

    });

    socket.on('typingstoped', function (data) {


        if (data && socket.agent) {
            data.from = socket.decoded_token.jti;
            io.in(socket.agent).emit("typingstoped", data);
        }

    });

    socket.on('seen', function (data) {


        if (data && socket.agent && data.id) {
            data.from = socket.decoded_token.jti;
            data.status = 'seen';
            io.in(socket.agent).emit("seen", data);
            UpdateRead(data.id);
        }
    });

    socket.on('agent', function (data) {
        logger.info(data);
        if (!socket.agent) {
            socket.agent = data.username;

            if (socket.message_buffer) {
                var preMessages = socket.message_buffer.shift();
                preMessages.forEach(function (item) {

                    logger.info(data);
                    //io.to(socket.decoded_token.iss).emit('echo', data);
                    data.from = socket.decoded_token.jti;
                    data.display = socket.decoded_token.name;
                    data.time = Date.now();
                    data.to = socket.agent;
                    data.who = 'client';

                    var id = uuid.v1();
                    if (data.id)
                        id = data.id;


                    var toRedisKey = util.format("%s:messaging:status", data.to);

                    var message = PersonalMessage({

                        type: item.type,
                        created_at: Date.now(),
                        updated_at: Date.now(),
                        status: 'pending',
                        uuid: id,
                        data: item.message,
                        session: socket.decoded_token.sessionId || socket.decoded_token.jti,
                        from: socket.decoded_token.name || socket.decoded_token.jti,
                        to: item.to

                    });


                    item.id = id;
                    io.in(item.to).emit("message", item);
                    message.status = 'delivered';

                    SaveMessage(message);
                })

                socket.message_buffer = [];

            }

        } else {

            io.in(data.username).emit("message", "Chat has routed to another user");
        }
        //io.to(agent).emit("clientdata", client_data);
    });

    socket.on('existingagent', function (data) {
        logger.info(data);
        //socket.agent = data.username;

        if (!socket.agent) {
            socket.agent = data.username;
            io.in(agent).emit("existingclient", client_data);
        } else {

            io.in(data.username).emit("message", "Chat has routed to another user");
        }

    });

    socket.on('retryagent', function () {

        ards.PickResource(client_data.tenant, client_data.company, client_data.jti, client_data.attributes, client_data.priority, 1, otherInfo, function (err, resource) {

            if (resource && resource.ResourceInfo) {

                var agent = resource.ResourceInfo.Profile;
                socket.agent = agent;

                client_data.profile = socket.profile;
                io.in(agent).emit("client", client_data);


            } else {
                socket.emit('connectionerror', 'no_agent_found');
            }
        });

    });

    socket.on('disconnect', function () {

        console.log("socket disconnected");

        //if (socket.agent)
        //    io.to(socket.agent).emit("left", client_data);

    });

    socket.on('sessionend', function (data) {
        console.log(data);
        if (socket.agent)
            io.in(socket.agent).emit("left", client_data);

    });

    socket.on('error', function (error) {

        logger.error(error);

    });
});


