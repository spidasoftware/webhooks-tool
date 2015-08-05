//Logger
//Wrapper for bunyan used to setup and define logs
var bunyan = require('bunyan');
var mkdirp = require('mkdirp');

mkdirp.sync('./logs');

var streams = [{
    level: 'debug',
    type: 'rotating-file',
    period: '1d',
    count: 10,
    path: './logs/webhooksTool.log'
}];

var loggerNames = ['web','config','main','db','hook','importExport'];

var logger = {};
loggerNames.forEach(function(name) {
    logger[name] = bunyan.createLogger({name: name, streams: streams});
});

module.exports = logger;
