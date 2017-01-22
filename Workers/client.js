/**
 * Created by Sukitha on 1/10/2017.
 */


var socket = require('socket.io-client')('http://localhost:3333');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;

socket.on('connect', function(){

    logger.info("connected");

    socket.emit('authenticate', {token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdWtpdGhhIiwianRpIjoiMTdmZTE4M2QtM2QyNC00NjQwLTg1NTgtNWFkNGQ5YzVlMzE1Iiwic3ViIjoiQWNjZXNzIGNsaWVudCIsImV4cCI6MTQ4NTQ5NjA2MywidGVuYW50IjoxLCJjb21wYW55IjoxMDMsImNvbnRleHQiOnsicmVzb3VyY2VpZCI6IjcwIiwidmVlcnlhY2NvdW50Ijp7InR5cGUiOiJzaXAiLCJ2ZXJpZmllZCI6dHJ1ZSwiZGlzcGxheSI6IjU5NDMiLCJjb250YWN0Ijoic2x0X3Rlc3RAZHVvLm1lZGlhMS52ZWVyeS5jbG91ZCJ9fSwic2NvcGUiOlt7InJlc291cmNlIjoibXlOYXZpZ2F0aW9uIiwiYWN0aW9ucyI6WyJyZWFkIl19LHsicmVzb3VyY2UiOiJteVVzZXJQcm9maWxlIiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX0seyJyZXNvdXJjZSI6InBieGFkbWluIiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX0seyJyZXNvdXJjZSI6InBieHVzZXIiLCJhY3Rpb25zIjpbInJlYWQiLCJ3cml0ZSIsImRlbGV0ZSJdfSx7InJlc291cmNlIjoic2lwdXNlciIsImFjdGlvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl19LHsicmVzb3VyY2UiOiJzY2hlZHVsZSIsImFjdGlvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl19LHsicmVzb3VyY2UiOiJmaWxlc2VydmljZSIsImFjdGlvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl19LHsicmVzb3VyY2UiOiJwYWNrYWdlIiwiYWN0aW9ucyI6WyJyZWFkIl19LHsicmVzb3VyY2UiOiJub3RpZmljYXRpb24iLCJhY3Rpb25zIjpbInJlYWQiLCJ3cml0ZSIsImRlbGV0ZSJdfSx7InJlc291cmNlIjoiYXJkc3Jlc291cmNlIiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX0seyJyZXNvdXJjZSI6InJlcXVlc3RtZXRhIiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX0seyJyZXNvdXJjZSI6InN5c21vbml0b3JpbmciLCJhY3Rpb25zIjpbInJlYWQiLCJ3cml0ZSIsImRlbGV0ZSJdfSx7InJlc291cmNlIjoiZXZlbnRzIiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX0seyJyZXNvdXJjZSI6ImV4dGVybmFsVXNlciIsImFjdGlvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl19LHsicmVzb3VyY2UiOiJ1c2VyR3JvdXAiLCJhY3Rpb25zIjpbInJlYWQiLCJ3cml0ZSIsImRlbGV0ZSJdfSx7InJlc291cmNlIjoidXNlciIsImFjdGlvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl19LHsicmVzb3VyY2UiOiJlbmdhZ2VtZW50IiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX0seyJyZXNvdXJjZSI6ImluYm94IiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX0seyJyZXNvdXJjZSI6InRpY2tldCIsImFjdGlvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl19LHsicmVzb3VyY2UiOiJ0YWciLCJhY3Rpb25zIjpbInJlYWQiLCJ3cml0ZSIsImRlbGV0ZSJdfSx7InJlc291cmNlIjoidGltZXIiLCJhY3Rpb25zIjpbInJlYWQiLCJ3cml0ZSIsImRlbGV0ZSJdfSx7InJlc291cmNlIjoidGlja2V0dmlldyIsImFjdGlvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl19LHsicmVzb3VyY2UiOiJmb3JtcyIsImFjdGlvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl19LHsicmVzb3VyY2UiOiJkYXNoYm9hcmRldmVudCIsImFjdGlvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl19LHsicmVzb3VyY2UiOiJkYXNoYm9hcmRncmFwaCIsImFjdGlvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl19LHsicmVzb3VyY2UiOiJwcm9kdWN0aXZpdHkiLCJhY3Rpb25zIjpbInJlYWQiLCJ3cml0ZSIsImRlbGV0ZSJdfSx7InJlc291cmNlIjoic29jaWFsIiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX0seyJyZXNvdXJjZSI6InRvZG8iLCJhY3Rpb25zIjpbInJlYWQiLCJ3cml0ZSIsImRlbGV0ZSJdfSx7InJlc291cmNlIjoicmVtaW5kIiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX0seyJyZXNvdXJjZSI6ImludGVncmF0aW9uIiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX0seyJyZXNvdXJjZSI6InRpY2tldHR5cGVzIiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX0seyJyZXNvdXJjZSI6InRpY2tldHN0YXR1c2Zsb3ciLCJhY3Rpb25zIjpbInJlYWQiLCJ3cml0ZSIsImRlbGV0ZSJdfV0sImlhdCI6MTQ4NDg5MTI2M30._pyQ2DmbccMi-qM6KhvkIHJbHD05o5HoulWmi63IKq0"});

    //socket.emit('request',{request:'oldmessages', from:'John Doe', to: 'sukitha', uuid: '949f5e50-da50-11e6-a30d-5b0aa8552477'});

});

socket.on('echo', function(data){

    logger.info(data);
});

socket.on('unauthorized', function(msg) {
    console.log("unauthorized: " + JSON.stringify(msg.data));
    throw new Error(msg.data.type);
});

socket.on('authenticated', function () {

    socket.emit( 'status', {presence: 'online'});
    socket.emit('request',{request:'chatstatus', from:'duoowner', to: 'sukitha'});
    //socket.emit( 'message', {message: 'test', to: 'sukitha'});
})

socket.on('event', function(data){

    logger.info(data);
});

socket.on('pending', function(data){

    logger.info(data);
});

socket.on('status', function(data){

    logger.info(data);


});

socket.on('chatstatus', function(data){

    logger.info(data);
    socket.emit('request',{request:'latestmessages', from:'John Doe', to: 'sukitha', uuid: '949f5e50-da50-11e6-a30d-5b0aa8552477'});

});


socket.on('message', function(data){

    logger.info(data);

    socket.emit('seen',{to: data.to, uuid: data.id});

});

socket.on('seen', function(data){

    logger.info(data);
});

socket.on('latestmessages', function(data){

    logger.info(data);
});


socket.on('typing', function(data){

    logger.info(data);
});

socket.on('disconnect', function(data){

    logger.info("disconnected");
});

socket.on('client', function(data){

    logger.info(data);

    socket.emit('accept',{to: data.jti});
    //socket.emit('sessionend',{to: data.jti});
});

socket.on('left', function(data){

    logger.info(data.jti);
    socket.emit('sessionend',{to: data.jti});
});