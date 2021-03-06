module.exports = {


    "Mongo":
    {
        "ip":"104.236.231.11",
        "port":"27017",
        "dbname":"dvpdb",
        "password":"DuoS123",
        "user":"duo"
    },


    "Redis":
    {
        "mode":"sentinel",//instance, cluster, sentinel
        "ip": "45.55.142.207",
        "port": 6389,
        "user": "duo",
        "db": 2,
        "password": "DuoS123",
        "sentinels":{
            "hosts": "138.197.90.92,45.55.205.92,138.197.90.92",
            "port":16389,
            "name":"redis-cluster"
        }

    },


    "Security":
    {

        "ip" : "45.55.142.207",
        "port": 6389,
        "user": "duo",
        "password": "DuoS123",
        "mode":"sentinel",//instance, cluster, sentinel
        "sentinels":{
            "hosts": "138.197.90.92,45.55.205.92,138.197.90.92",
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
        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdWtpdGhhIiwianRpIjoiYWEzOGRmZWYtNDFhOC00MWUyLTgwMzktOTJjZTY0YjM4ZDFmIiwic3ViIjoiNTZhOWU3NTlmYjA3MTkwN2EwMDAwMDAxMjVkOWU4MGI1YzdjNGY5ODQ2NmY5MjExNzk2ZWJmNDMiLCJleHAiOjE5MDIzODExMTgsInRlbmFudCI6LTEsImNvbXBhbnkiOi0xLCJzY29wZSI6W3sicmVzb3VyY2UiOiJhbGwiLCJhY3Rpb25zIjoiYWxsIn1dLCJpYXQiOjE0NzAzODExMTh9.Gmlu00Uj66Fzts-w6qEwNUz46XYGzE8wHUhAJOFtiRo"

    },



    "Services": {


        "interactionurl": "interactions.app.veery.cloud",//interactions.app.veery.cloud
        "interactionport": '3637',
        "interactionversion":"1.0.0.0",
        "ardsliteservice": "ardsliteservice.app.veery.cloud",//ardsliteservice.app.veery.cloud
        "ardsliteport": "8828",
        "ardsliteversion": "1.0.0.0"


    }
};