/**
 * Created by Sukitha on 1/13/2017.
 */

var util = require('util');
var config = require('config');
var request = require("request");
var validator = require('validator');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var token = util.format("Bearer %s",config.Host.token);
var uuid = require('node-uuid');
var redis = require('redis').createClient;

var redisip = config.Security.ip;
var redisport = config.Security.port;
var redisuser = config.Security.user;
var redispass = config.Security.password;

var redisClient = redis(redisport,redisip,{ auth_pass: redispass });


redisClient.on("error", function (err) {
    logger.error("Error ",  err);

});

redisClient.on("connected", function () {
    logger.info("Redis Connected ");


});


module.exports.CompanyChatSecret = function(req, payload, done){

    //var session = uuid.v1();

    if(payload && payload.iss && payload.jti && payload.name && payload.company && payload.tenant) {
        var issuer = payload.iss;
        var jti = payload.jti;

        //payload.session = payload.jti;
        var chatKey = util.format('%d:%d:keys:chat:public', payload.tenant, payload.company);

        redisClient.get(chatKey, function (err, key) {

            if (err) {
                return done(err);
            }
            if (!key) {
                return done(new Error('missing_secret'));
            }else{

                return done(null, key);
            }
        });
    }else{
        done(new Error('wrong token format'));
    }
};

module.exports.CreateEngagement = function (payload,  cb){

    if((config.Services && config.Services.interactionurl && config.Services.interactionport && config.Services.interactionversion)) {


        var engagementURL = util.format("http://%s/DVP/API/%s/EngagementSessionForProfile", config.Services.interactionurl, config.Services.interactionversion);
        if (validator.isIP(config.Services.interactionurl))
            engagementURL = util.format("http://%s:%d/DVP/API/%s/EngagementSessionForProfile", config.Services.interactionurl, config.Services.interactionport, config.Services.interactionversion);

        var engagementData =  {
            "engagement_id": payload.jti,
            "channel": 'chat',
            "direction": 'inbound',
            "channel_from":payload.name,
            "channel_to": payload.iss
        };

        if(payload.session_id)
            engagementData.engagement_id = payload.session_id;


        if(payload.channel){
            engagementData.channel = payload.channel;
        }

        if(payload.jti){
            engagementData.channel_id = payload.jti;
            //req.body.channel_id
        }

        if(payload.contact){
            engagementData.raw = payload.contact;
        }

        logger.debug("Calling Engagement service URL %s", engagementURL);
        request({
            method: "POST",
            url: engagementURL,
            headers: {
                authorization: token,
                companyinfo: util.format("%d:%d", payload.tenant, payload.company)
            },
            json: engagementData
        }, function (_error, _response, datax) {

            try {

                if (!_error && _response && _response.statusCode == 200, _response.body && _response.body.IsSuccess) {


                    var profile;
                    if (_response.body.Result && _response.body.Result.profile_id) {

                        profile = _response.body.Result.profile_id;
                    }


                    return cb(null, profile);

                }else{

                    logger.error("There is an error in  create engagements for this session "+ payload.jit);
                    //done(new Error('engagement_failed'));
                    return cb(_error);


                }
            }
            catch (excep) {

                cb(excep);

            }
        });
    }else{

        return done(new Error('missing_config'));
    }

}



