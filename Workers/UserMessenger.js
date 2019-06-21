/**
 * Created by Sukitha on 1/10/2017.
 */
var util = require('util');
var config = require('config');
var uuid = require('node-uuid');
var port = config.Host.internalport || 3000;


var io = require('socket.io')(port);
var redis = require('ioredis');
var adapter = require('socket.io-redis');
//var adapter = require('socket.io-ioredis');
var socketioJwt = require("socketio-jwt");
var secret = require('dvp-common/Authentication/Secret.js');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
//var User = require('dvp-mongomodels/model/User');
var PersonalMessage = require('dvp-mongomodels/model/Room').PersonalMessage;
var Room = require('dvp-mongomodels/model/Room').Room;
var Message = require('dvp-mongomodels/model/Room').Message;
var ards = require('./Ards');
var UserAccount = require('dvp-mongomodels/model/UserAccount');
var crypto_handler = require('./crypto_handler.js');
var Common = require('./Common.js');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var validator = require('validator');
var redisip = config.Redis.ip;
var redisport = config.Redis.port;
var redispass = config.Redis.password;
var redismode = config.Redis.mode;
var redisdb = config.Redis.db;

var bot_usr_redis_id = config.Host.botclientusers;

var ChatConfig = require('dvp-mongomodels/model/ChatConfig');

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
        pubclient = redis(redisSetting);
        subclient = redis(redisSetting);
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

pubclient.on("error", function (err) {
    logger.error("Error ", err);
});

subclient.on("node error", function (err) {
    logger.error("Error ", err);
});

pubclient.on("node error", function (err) {
    logger.error("Error ", err);
});


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

function set_chat_session(tenant, company, session_id, reason, agent_data) {
    try {

        var jsonString;
        ards.RemoveArdsRequest(tenant, company, session_id, 'NONE', function (err, res) {

            jsonString = messageFormatter.FormatMessage(err, "accept chat - RemoveArdsRequest", true, res);
            logger.info('accept - set_chat_session - : %s ', jsonString);
        });

        var key = "api-" + session_id;
        redisClient.set(key, JSON.stringify(agent_data), function (err, obj) {
            if (err) {
                jsonString = messageFormatter.FormatMessage(undefined, "set_chat_session - fail to set assigned agent", false, undefined);
                logger.error('set_chat_session : %s ', jsonString);
            } else {
                jsonString = messageFormatter.FormatMessage(undefined, "set_chat_session - set assigned agent", true, obj);
                logger.info('set_chat_session : %s ', jsonString);
            }
        })
    } catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error('set_chat_session - Exception occurred : %s ', jsonString);
    }
}

var io_emit_message = function (event_name, io_in_o_io_to, data, post_data) {

    try {
        var jsonString = "io_emit_message - done";
        redisClient.hget(bot_usr_redis_id, data.sessionId, function (err, obj) {
            if (obj) {
                var session_data = JSON.parse(obj);
                if (session_data.communication_type === "http") {
                    var service_url = util.format("http://%s/DVP/API/%s/IPMessengerAPI/Massage/%s", config.Services.ipmessagingapiurl, config.Services.ipmessagingapiversion, data.jti);
                    if (validator.isIP(config.Services.ipmessagingapiurl)) {
                        service_url = util.format("http://%s:%s/DVP/API/%s/IPMessengerAPI/Massage/%s", config.Services.ipmessagingapiurl, config.Services.ipmessagingapiport, config.Services.ipmessagingapiversion, data.jti);
                    }

                    post_data.body = data;
                    post_data.event_name = event_name;

                    Common.http_post(service_url, post_data, util.format("%d:%d", session_data.client_data.tenant, session_data.client_data.company));

                    switch (event_name) {
                        case "agent":
                            set_chat_session(data.tenant, data.company, data.sessionId, 'NONE',data);
                            /*ards.RemoveArdsRequest(data.tenant, data.company, data.sessionId, 'NONE', function (err, res) {

                                jsonString = messageFormatter.FormatMessage(err, "accept chat - RemoveArdsRequest", true, res);
                                logger.info('accept -RemoveArdsRequest - : %s ', jsonString);
                            });*/
                            break;
                        case "agent_rejected":
                            var info = post_data[event_name];
                            ards.RemoveArdsRequest(info.tenant, info.company, data.sessionId, 'AgentRejected', function (err, res) {
                                var jsonString = messageFormatter.FormatMessage(err, "accept chat - RemoveArdsRequest", true, res);
                                logger.info('accept -RemoveArdsRequest - : %s ', jsonString);
                            });
                            break;
                    }
                } else {
                    if (io_in_o_io_to === "to") {
                        io.to(data.to).emit(event_name, post_data[event_name]);
                    }
                    else if (io_in_o_io_to === "in") {
                        io.in(data.to).emit(event_name, post_data[event_name]);
                    } else {
                        logger.error("invalid io_in_o_io_to params");
                    }
                }
            } else {

                if (io_in_o_io_to === "to") {
                    io.to(data.to).emit(event_name, post_data[event_name]);
                }
                else if (io_in_o_io_to === "in") {
                    io.in(data.to).emit(event_name, post_data[event_name]);
                } else {
                    logger.error("invalid io_in_o_io_to params");
                }

            }
            logger.info(jsonString);
        });

    } catch (ex) {
        logger.error('io_emit_message', ex);
    }
};

var socket_emit_message = function (event_name, post_data) {

    try {

        socket.emit(event_name, {
            from: post_data.to,
            to: post_data.iss,
            id: post_data.id,
            status: status.status
        });

        return;

        var jsonString = "socket_emit_message - done";
        redisClient.hget(bot_usr_redis_id, data.sessionId, function (err, obj) {
            if (obj) {
                var session_data = JSON.parse(obj);
                if (session_data.communication_type === "http") {
                    var service_url = util.format("http://%s/DVP/API/%s/IPMessengerAPI/Massage/%s", config.Services.ipmessagingapiurl, config.Services.ipmessagingapiversion, data.jti);
                    if (validator.isIP(config.Services.ipmessagingapiurl)) {
                        service_url = util.format("http://%s:%s/DVP/API/%s/IPMessengerAPI/Massage/%s", config.Services.ipmessagingapiurl, config.Services.ipmessagingapiport, config.Services.ipmessagingapiversion, data.jti);
                    }
                    post_data.event_name = event_name;
                    Common.http_post(service_url, post_data, util.format("%d:%d", session_data.client_data.tenant, session_data.client_data.company))
                } else {
                    socket.emit(event_name, {
                        from: post_data.to,
                        to: post_data.iss,
                        id: post_data.id,
                        status: status.status
                    });
                    //'seen', {from: data.to,to: socket.decoded_token.iss,id: id,status: 'nouser'}
                }
            } else {
                socket.emit(event_name, {
                    from: post_data.to,
                    to: post_data.iss,
                    id: post_data.id,
                    status: status.status
                });
            }
            logger.info(jsonString);
        });
    } catch (ex) {
        logger.error('io_emit_message', ex);
    }
};

var send_welcome_message = function (data, tenant, company) {
    try {


        var qObj = {company: company, tenant: tenant, enabled: true};

        ChatConfig.findOne(qObj).exec(function (err, pConfig) {
            if (pConfig) {

                var msg = {
                    from: "System",
                    time: Date.now(),
                    id: uuid.v1(),
                    status: 'delivered',
                    to: data.to,
                    who: 'client',
                    message: pConfig.welcomeMessage
                };
                //io.in(to).emit("message", msg);
                io_emit_message("message", "in", data, {message: msg});

                var message = PersonalMessage({

                    type: "text",
                    created_at: msg.time,
                    updated_at: msg.time,
                    status: 'delivered',
                    uuid: msg.id,
                    session: data.sessionId,
                    data: msg.message,
                    from: msg.from,
                    to: msg.to
                });
                SaveMessage(message);
            }

        });


    } catch (ex) {
        console.error(ex);
    }

};

io.sockets.on('connection',
    socketioJwt.authorize({secret: secret.Secret, timeout: 15000}))
    .on('authenticated', function (socket) {


        socket.join(socket.decoded_token.iss);
        logger.info("Joining to the room " + socket.decoded_token.iss);

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
                    session: data.sessionId,
                    from: socket.decoded_token.iss,
                    to: data.to

                });

                function message_using_io(message) {
                    io.sockets.adapter.clients([data.to], function (err, clients) {
                        if (err) {
                            socket.emit('seen', {
                                from: data.to,
                                to: socket.decoded_token.iss,
                                id: id,
                                status: 'nouser'
                            });
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

                redisClient.hget(bot_usr_redis_id, data.sessionId, function (err, obj) {
                    if (obj) {
                        var session_data = JSON.parse(obj);
                        if (session_data.communication_type === "http") {
                            var service_url = util.format("http://%s/DVP/API/%s/IPMessengerAPI/Massage/%s", config.Services.ipmessagingapiurl, config.Services.ipmessagingapiversion, data.jti);
                            if (validator.isIP(config.Services.ipmessagingapiurl)) {
                                service_url = util.format("http://%s:%s/DVP/API/%s/IPMessengerAPI/Massage/%s", config.Services.ipmessagingapiurl, config.Services.ipmessagingapiport, config.Services.ipmessagingapiversion, data.jti);
                            }
                            var post_data = {event_name: "message", message: message, body: data};
                            Common.http_post(service_url, post_data, util.format("%d:%d", session_data.client_data.tenant, session_data.client_data.company));
                            SaveMessage(message);
                        } else {
                            message_using_io(message);
                        }
                    } else {
                        message_using_io(message);
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


                UserAccount.findOne({
                    company: socket.decoded_token.company,
                    tenant: socket.decoded_token.tenant,
                    user: socket.decoded_token.iss
                })
                    .populate("userref", "username name avatar firstname lastname")
                    .exec(function (err, userAccount) {
                        if (err) {
                            console.error(err);
                        } else {

                            var user = userAccount.userref;
                            if (user) {

                                var agentData = {
                                    username: user.username,
                                    name: user.firstname + "" + user.lastname,
                                    id: user.id,
                                    avatar: user.avatar,
                                };

                                if (data.profile) {

                                    agentData.client = data.profile;
                                }

                                var client_data = socket.decoded_token;

                                //io.to(data.to).emit("agent", agentData);
                                data.company = socket.decoded_token.company;
                                data.tenant = socket.decoded_token.tenant;
                                io_emit_message("agent", "to", data, {agent: agentData});

                                //socket.clientjti = data.to;
                                ards.UpdateResource(client_data.tenant, client_data.company, data.to, client_data.context.resourceid, 'Connected', '', '', 'inbound');


                                var onlineClientsUsers = util.format("%d:%d:client:online:%s", client_data.tenant, client_data.company, data.jti);
                                var messageBufferKey = util.format("%d:%d:client:buffer:%s", client_data.tenant, client_data.company, data.jti);

                                data.agent = socket.decoded_token.iss;
                                data.agentdata = agentData;
                                var jsonData = JSON.stringify(data);

                                send_welcome_message(data, client_data.tenant, client_data.company);

                                redisClient.set(onlineClientsUsers, jsonData, function (clientUserSet) {


                                    redisClient.lrange(messageBufferKey, 0, -1, function (err, replies) {
                                        console.log(replies.length);
                                        replies.forEach(function (reply, index) {
                                            console.log("Reply " + index + ": " + JSON.parse(reply).title);
                                            var msg = JSON.parse(reply);
                                            msg.from = data.jti;
                                            msg.time = Date.now();
                                            var id = uuid.v1();
                                            if (data.id)
                                                id = data.id;
                                            msg.id = id;
                                            msg.status = 'delivered';
                                            msg.to = socket.decoded_token.iss;
                                            msg.who = 'client';
                                            io.in(msg.to).emit("message", msg);


                                            var message = PersonalMessage({

                                                type: msg.type,
                                                created_at: Date.now(),
                                                updated_at: Date.now(),
                                                status: 'delivered',
                                                uuid: id,
                                                data: msg.message,
                                                from: data.jti,
                                                session: data.sessionId,
                                                to: socket.decoded_token.iss,
                                                who: 'client'

                                            });


                                            SaveMessage(message);

                                        });

                                        redisClient.del(messageBufferKey);


                                        // if(socket.message_buffer){
                                        //     var preMessages = socket.message_buffer.shift();
                                        //     preMessages.forEach(function(item){
                                        //
                                        //         logger.info(data);
                                        //         //io.to(socket.decoded_token.iss).emit('echo', data);
                                        //         data.from = socket.decoded_token.jti;
                                        //         data.display = socket.decoded_token.name;
                                        //         data.time = Date.now();
                                        //         data.to = socket.agent;
                                        //         data.who = 'client';
                                        //
                                        //         var id = uuid.v1();
                                        //         if (data.id)
                                        //             id = data.id;
                                        //
                                        //
                                        //         var toRedisKey = util.format("%s:messaging:status", data.to);
                                        //
                                        //         var message = PersonalMessage({
                                        //
                                        //             type: item.type,
                                        //             created_at: Date.now(),
                                        //             updated_at: Date.now(),
                                        //             status: 'pending',
                                        //             uuid: id,
                                        //             data: item.message,
                                        //             session: socket.decoded_token.jti,
                                        //             from: socket.decoded_token.jti,
                                        //             to: item.to
                                        //
                                        //         });
                                        //
                                        //
                                        //         item.id = id;
                                        //         io.in(item.to).emit("message", item);
                                        //         message.status = 'delivered';
                                        //
                                        //         SaveMessage(message);
                                        //     })
                                        //
                                        //     socket.message_buffer = [];
                                        //
                                        // }


                                    });
                                });

                            } else {

                            }
                        }

                    });
            }

        });

        socket.on('reject', function (data) {
            if (data && data.to) {
                var client_data = socket.decoded_token;
                //io.to(data.to).emit("agent_rejected", client_data);
                io_emit_message("agent_rejected", "to", data, {agent_rejected: client_data});

            }
        });

        socket.on('ticket', function (data) {

            io.to(data.to).emit("ticket", data);

        });

        socket.on('sessionend', function (data) {

            if (data && data.to) {
                var client_data = socket.decoded_token;
                //io.to(data.to).emit("left", client_data);
                data.sessionId = data.data ? data.data.sessionId : "";
                io_emit_message("sessionend", "to", data, {sessionend: {sessionend:"sessionend"}});

                var message = PersonalMessage({

                    type: "end",
                    created_at: Date.now(),
                    updated_at: Date.now(),
                    status: 'delivered',
                    uuid: uuid.v4(),
                    data: data.message,
                    session: data.sessionId,
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
                    session: data.sessionId,
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
                //io.to(data.to).emit("typing", data);
                io_emit_message("typing", "to", data, {typing: socket.decoded_token});
            }

        });

        socket.on('typingstoped', function (data) {

            if (data && data.to) {
                data.from = socket.decoded_token.iss;
                //io.to(data.to).emit("typingstoped", data);
                io_emit_message("typingstoped", "to", data, {typingstoped: socket.decoded_token});
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

                case 'clients':

                    io.sockets.adapter.clients([data.room], function (err, clients) {
                        if (clients) {
                            socket.emit("clients", clients);
                        }
                    });

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

                        if (data.who && data.who === "client") {
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
                                        oldmessages = Common.DecryptMessages(oldmessages);
                                        socket.emit("oldmessages", {from: requester, messages: oldmessages});
                                    } else {

                                        logger.error('No old message found');
                                        socket.emit('connectionerror', {
                                            action: 'oldmessages',
                                            from: requester,
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

                            if (data.who && data.who === "client") {
                                query = {
                                    created_at: {$gt: obj.created_at},
                                    $or: [{from: customer}, {to: customer}]
                                };
                            }

                            //created_at: {$gt: obj.created_at},
                            //$or: [{from: from, to: to}, {from: to, to: from}]

                            PersonalMessage.find(query).lean().sort({created_at: 1}).limit(100)
                                .exec(function (err, newmessages) {

                                    if (data) {
                                        newmessages = Common.DecryptMessages(newmessages);
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

                    if (data.who && data.who === "client") {

                        query = {
                            $or: [{from: from}, {to: from}]
                        };
                    }

                    PersonalMessage.find(query).lean().sort({created_at: -1}).limit(100)
                        .exec(function (err, latestmessages) {

                            if (latestmessages && Array.isArray(latestmessages)) {
                                latestmessages = Common.DecryptMessages(latestmessages);
                                io.to(socket.decoded_token.iss).emit("latestmessages", {
                                    from: data.from,
                                    messages: latestmessages.reverse()
                                });

                                //io.to(socket.decoded_token.iss).emit("latestmessages", latestmessages.reverse());

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
                                messages = Common.DecryptMessages(messages);
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
                //io.to(data.to).emit("seen", data);
                io_emit_message("seen", "to", data, {seen: socket.decoded_token});
                UpdateRead(data.id);
            }
        });

        socket.on('disconnect', function (reason) {


            console.log("Bye " + socket.decoded_token.iss + " Reason: " + reason);
            io.sockets.adapter.clients([socket.decoded_token.iss], function (err, clients) {
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

        socket.on('subscribe', function (data) {

            //queue:details
            if (data && data.room) {

                var uniqueRoom = util.format('%d:%d:subscribe:%s', socket.decoded_token.tenant, socket.decoded_token.company, data.room)
                socket.join(uniqueRoom);

            } else {
                socket.emit('error', {action: 'subscribe', message: 'no data found'});
            }

        });

        socket.on('unsubscribe', function (data) {

            if (data && data.room) {

                var uniqueRoom = util.format('%d:%d:subscribe:%s', socket.decoded_token.tenant, socket.decoded_token.company, data.room)
                socket.leave(uniqueRoom);

            } else {
                socket.emit('error', {action: 'subscribe', message: 'no data found'});
            }

        });


    });
