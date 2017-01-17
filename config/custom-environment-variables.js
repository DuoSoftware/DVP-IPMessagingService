module.exports = {
    "Mongo":
    {
        "ip":"SYS_MONGO_HOST",
        "port":"SYS_MONGO_PORT",
        "dbname":"SYS_MONGO_DB",
        "password":"SYS_MONGO_PASSWORD",
        "user":"SYS_MONGO_USER"
    },


    "Redis":
    {
        "ip": "SYS_REDIS_HOST",
        "port": "SYS_REDIS_PORT",
        "db": "SYS_REDIS_DB",
        "user": "SYS_REDIS_USER",
        "password": "SYS_REDIS_PASSWORD"

    },

    "Security":
    {
        "ip": "SYS_REDIS_HOST",
        "port": "SYS_REDIS_PORT",
        "user": "SYS_REDIS_USER",
        "password": "SYS_REDIS_PASSWORD"

    },

    "Host":
    {
        "vdomain": "LB_FRONTEND",
        "domain": "HOST_NAME",
        "port": "HOST_CSATSERVICE_PORT",
        "version": "HOST_VERSION"
    },

    "LBServer" : {

        "ip": "LB_FRONTEND",
        "port": "LB_PORT"

    },

    "Services": {

        "interactionurl": "SYS_INTERACTION_HOST",
        "interactionport": "SYS_INTERACTION_PORT",
        "interactionversion":"SYS_INTERACTION_VERSION",
        "ardsliteservice": "SYS_ARDSLITESERVICE_HOST",
        "ardsliteport": "SYS_ARDSLITESERVICE_PORT",
        "ardsliteversion": "SYS_ARDSLITESERVICE_VERSION"
    }
};

//NODE_CONFIG_DIR
