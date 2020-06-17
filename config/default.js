module.exports = {


    "Mongo":{
        ip: "",
        port: "",
        dbname: "",
        password: "",
        user: "",
        type: "mongodb+srv",
    },


    "Redis":
        {
            "mode":"instance",//instance, cluster, sentinel
            "ip": "138.197.90.92",
            "port": 6389,
            "user": "",
            "db": 2,
            "password": "",
            "sentinels":{
                "hosts": "138.197.90.92,45.55.205.92,138.197.90.92",
                "port":16389,
                "name":"redis-cluster"
            }

        },


    "Security":
        {

            "ip" : "138.197.90.92",
            "port": 6389,
            "user": "",
            "password": "",
            "mode":"instance",//instance, cluster, sentinel
            "sentinels":{
                "hosts": "138.197.90.92,45.55.205.92,138.197.90.92",
                "port":16389,
                "name":"redis-cluster"
            }
        },

    "Host":
        {
            "botclientusers":"ip_api_bot_online_users",
            "vdomain": "localhost",
            "domain": "localhost",
            "internalport": "8889",
            "externalport": "8890",
            "version": "1.0",
            //"messenger": "user",
            "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdWtpdGhhIiwianRpIjoiYWEzOGRmZWYtNDFhOC00MWUyLTgwMzktOTJjZTY0YjM4ZDFmIiwic3ViIjoiNTZhOWU3NTlmYjA3MTkwN2EwMDAwMDAxMjVkOWU4MGI1YzdjNGY5ODQ2NmY5MjExNzk2ZWJmNDMiLCJleHAiOjE5MDIzODExMTgsInRlbmFudCI6LTEsImNvbXBhbnkiOi0xLCJzY29wZSI6W3sicmVzb3VyY2UiOiJhbGwiLCJhY3Rpb25zIjoiYWxsIn1dLCJpYXQiOjE0NzAzODExMTh9.Gmlu00Uj66Fzts-w6qEwNUz46XYGzE8wHUhAJOFtiRo",
            "encryptedhex":"1, 12, 3, 4, 5, 16, 7, 8, 12, 10, 11, 12, 13, 14, 15, 16"// accept only 1-16

        },



    "Services": {


        "interactionurl": "interactions.app.veery.cloud",//interactions.app.veery.cloud
        "interactionport": '3637',
        "interactionversion":"1.0.0.0",

        "ardsliteservice": "ardsliteservice.app.veery.cloud",//ardsliteservice.app.veery.cloud
        "ardsliteport": "8828",
        "ardsliteversion": "1.0.0.0",

        "ipmessagingapiurl": "104.236.197.119",//ardsliteservice.app.veery.cloud
        "ipmessagingapiport": "3000",
        "ipmessagingapiversion": "1.0.0.0",
        "dynamicPort": true
    }
};
