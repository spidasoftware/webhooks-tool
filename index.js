#!/usr/bin/env node
var fs = require('fs');

//Parse command line args
var argv = require('yargs')
    .usage('Usage: $0 [options]')
    .default('d', __dirname + '/data')
    .describe('d', 'Set the data path')
    .alias('d','dataPath')
    .boolean('p')
    .describe('p', 'Create a pid file at webhooks-tool.pid')
    .alias('p','pid')
    .help('h')
    .alias('h','help')
    .epilog('(c) SPIDASoftware 2015')
    .argv;


var config = require('./src/config')(argv.dataPath);
var webhookDB = require('./src/db');
var web = require('./src/web');
var log = require('./src/logger').main;

var stopServer;  //Returned from web module, used to stop server when SIGINT is recieved

try {
    //Load DB
    webhookDB(config).then(function(db) {
        //Start web interface
        stopServer = web(config, db);
    }).catch(function(err) {
        log.error(err);
    });
} catch (err) {
    log.error(err);
}

//Log uncaught erros
process.on('unhandledRejection', function(err) {
    log.error(err);
});

//Stop server gracefully
process.on('SIGINT', function() {
    stopServer();
});

process.on('SIGTERM', function() {
    stopServer();
});

if (argv.pid) {
    //Write a pid file
    fs.writeFile('./webhooks-tool.pid',process.pid);
}



