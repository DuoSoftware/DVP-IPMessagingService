/**
 * Created by Sukitha on 1/10/2017.
 */


var socket = require('socket.io-client')('http://localhost:3333');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;

socket.on('connect', function(){

    logger.info("connected");

    socket.emit('authenticate', {token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJTTFRfVGVzdCIsImp0aSI6ImM4NTdiMzk0LTllZDAtNGJjNi04YWU2LWM5OGEzNzA1YTBiYyIsInN1YiI6IkFjY2VzcyBjbGllbnQiLCJleHAiOjE0ODUyMzk1MDAsInRlbmFudCI6MSwiY29tcGFueSI6MTAzLCJjb250ZXh0Ijp7InJlc291cmNlaWQiOiI3MCIsInZlZXJ5YWNjb3VudCI6eyJ0eXBlIjoic2lwIiwidmVyaWZpZWQiOnRydWUsImRpc3BsYXkiOiI1OTQzIiwiY29udGFjdCI6InNsdF90ZXN0QGR1by5tZWRpYTEudmVlcnkuY2xvdWQifX0sInNjb3BlIjpbeyJyZXNvdXJjZSI6Im15TmF2aWdhdGlvbiIsImFjdGlvbnMiOlsicmVhZCJdfSx7InJlc291cmNlIjoibXlVc2VyUHJvZmlsZSIsImFjdGlvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl19LHsicmVzb3VyY2UiOiJwYnhhZG1pbiIsImFjdGlvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl19LHsicmVzb3VyY2UiOiJwYnh1c2VyIiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX0seyJyZXNvdXJjZSI6InNpcHVzZXIiLCJhY3Rpb25zIjpbInJlYWQiLCJ3cml0ZSIsImRlbGV0ZSJdfSx7InJlc291cmNlIjoic2NoZWR1bGUiLCJhY3Rpb25zIjpbInJlYWQiLCJ3cml0ZSIsImRlbGV0ZSJdfSx7InJlc291cmNlIjoiZmlsZXNlcnZpY2UiLCJhY3Rpb25zIjpbInJlYWQiLCJ3cml0ZSIsImRlbGV0ZSJdfSx7InJlc291cmNlIjoicGFja2FnZSIsImFjdGlvbnMiOlsicmVhZCJdfSx7InJlc291cmNlIjoibm90aWZpY2F0aW9uIiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX0seyJyZXNvdXJjZSI6ImFyZHNyZXNvdXJjZSIsImFjdGlvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl19LHsicmVzb3VyY2UiOiJyZXF1ZXN0bWV0YSIsImFjdGlvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl19LHsicmVzb3VyY2UiOiJzeXNtb25pdG9yaW5nIiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX0seyJyZXNvdXJjZSI6ImV2ZW50cyIsImFjdGlvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl19LHsicmVzb3VyY2UiOiJleHRlcm5hbFVzZXIiLCJhY3Rpb25zIjpbInJlYWQiLCJ3cml0ZSIsImRlbGV0ZSJdfSx7InJlc291cmNlIjoidXNlckdyb3VwIiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX0seyJyZXNvdXJjZSI6InVzZXIiLCJhY3Rpb25zIjpbInJlYWQiLCJ3cml0ZSIsImRlbGV0ZSJdfSx7InJlc291cmNlIjoiZW5nYWdlbWVudCIsImFjdGlvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl19LHsicmVzb3VyY2UiOiJpbmJveCIsImFjdGlvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl19LHsicmVzb3VyY2UiOiJ0aWNrZXQiLCJhY3Rpb25zIjpbInJlYWQiLCJ3cml0ZSIsImRlbGV0ZSJdfSx7InJlc291cmNlIjoidGFnIiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX0seyJyZXNvdXJjZSI6InRpbWVyIiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX0seyJyZXNvdXJjZSI6InRpY2tldHZpZXciLCJhY3Rpb25zIjpbInJlYWQiLCJ3cml0ZSIsImRlbGV0ZSJdfSx7InJlc291cmNlIjoiZm9ybXMiLCJhY3Rpb25zIjpbInJlYWQiLCJ3cml0ZSIsImRlbGV0ZSJdfSx7InJlc291cmNlIjoiZGFzaGJvYXJkZXZlbnQiLCJhY3Rpb25zIjpbInJlYWQiLCJ3cml0ZSIsImRlbGV0ZSJdfSx7InJlc291cmNlIjoiZGFzaGJvYXJkZ3JhcGgiLCJhY3Rpb25zIjpbInJlYWQiLCJ3cml0ZSIsImRlbGV0ZSJdfSx7InJlc291cmNlIjoicHJvZHVjdGl2aXR5IiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX0seyJyZXNvdXJjZSI6InNvY2lhbCIsImFjdGlvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl19LHsicmVzb3VyY2UiOiJ0b2RvIiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX0seyJyZXNvdXJjZSI6InJlbWluZCIsImFjdGlvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl19LHsicmVzb3VyY2UiOiJpbnRlZ3JhdGlvbiIsImFjdGlvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl19LHsicmVzb3VyY2UiOiJ0aWNrZXR0eXBlcyIsImFjdGlvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl19LHsicmVzb3VyY2UiOiJ0aWNrZXRzdGF0dXNmbG93IiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX1dLCJpYXQiOjE0ODQ2MzQ3MDB9.WD09YrzlwmdqleMw93aPz2-9VChyPSTSuvcNcndrNeE"});

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
    //socket.emit( 'message', {message: 'test', to: 'sukitha'});
})

socket.on('event', function(data){

    logger.info(data);
});

socket.on('status', function(data){

    logger.info(data);
});

socket.on('message', function(data){

    logger.info(data);

    socket.emit('seen',{to: data.to, uuid: data.id});

});

socket.on('seen', function(data){

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
});