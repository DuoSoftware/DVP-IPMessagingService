module.exports = {


    "Mongo":
    {
        "ip":"",
        "port":"27017",
        "dbname":"",
        "password":"",
        "user":""
    },


    "Redis":
    {
        "mode":"sentinel",//instance, cluster, sentinel
        "ip": "",
        "port": 6389,
        "user": "",
        "db": 2,
        "password": "",
        "sentinels":{
            "hosts": "",
            "port":16389,
            "name":"redis-cluster"
        }

    },


    "Security":
    {

        "ip" : "",
        "port": 6389,
        "user": "",
        "password": "",
        "mode":"sentinel",//instance, cluster, sentinel
        "sentinels":{
            "hosts": "",
            "port":16389,
            "name":"redis-cluster"
        }
    },

    "Host":
    {
        "vdomain": "localhost",
        "domain": "localhost",
        "internalport": "8889",
        "externalport": "8890",
        "version": "1.0",
        //"messenger": "user",
        "token": ""

    },



    "Services": {


        "interactionurl": "",//interactions.app.veery.cloud
        "interactionport": '3637',
        "interactionversion":"1.0.0.0",
        "ardsliteservice": "",//ardsliteservice.app.veery.cloud
        "ardsliteport": "8828",
        "ardsliteversion": "1.0.0.0"


    }
};
