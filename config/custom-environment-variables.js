module.exports = {
    "Mongo":
    {
        "ip":"SYS_MONGO_HOST",
        "port":"SYS_MONGO_PORT",
        "dbname":"SYS_MONGO_DB",
        "password":"SYS_MONGO_PASSWORD",
        "user":"SYS_MONGO_USER",
        "replicaset" :"SYS_MONGO_REPLICASETNAME"
    },


    "Redis":
    {
        "mode":"SYS_REDIS_MODE",
        "ip": "SYS_REDIS_HOST",
        "port": "SYS_REDIS_PORT",
        "user": "SYS_REDIS_USER",
        "db":"SYS_REDIS_DB",
        "password": "SYS_REDIS_PASSWORD",
        "sentinels":{
            "hosts": "SYS_REDIS_SENTINEL_HOSTS",
            "port":"SYS_REDIS_SENTINEL_PORT",
            "name":"SYS_REDIS_SENTINEL_NAME"
        }

    },

    "Security":
    {

        "ip": "SYS_REDIS_HOST",
        "port": "SYS_REDIS_PORT",
        "user": "SYS_REDIS_USER",
        "password": "SYS_REDIS_PASSWORD",
        "mode":"SYS_REDIS_MODE",
        "sentinels":{
            "hosts": "SYS_REDIS_SENTINEL_HOSTS",
            "port":"SYS_REDIS_SENTINEL_PORT",
            "name":"SYS_REDIS_SENTINEL_NAME"
        }

    },


    "Host":
    {
        "vdomain": "LB_FRONTEND",
        "domain": "HOST_NAME",
        "port": "HOST_IPMESSANGERSERVICE_PORT",
        "version": "HOST_VERSION",
		"token": "HOST_TOKEN",
        "encryptedhex": "HOST_ENCRYPTEDHEX"
    },

    "LBServer" : {

        "ip": "LB_FRONTEND",
        "port": "LB_PORT"

    },

    "Services": {

        "interactionurl": "SYS_INTERACTIONS_HOST",
        "interactionport": "SYS_INTERACTIONS_PORT",
        "interactionversion":"SYS_INTERACTIONS_VERSION",
        "ardsliteservice": "SYS_ARDSLITESERVICE_HOST",
        "ardsliteport": "SYS_ARDSLITESERVICE_PORT",
        "ardsliteversion": "SYS_ARDSLITESERVICE_VERSION"
    }
};

//NODE_CONFIG_DIR
