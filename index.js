#!/usr/bin/env node
var fs = require('fs');

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
var stopServer;

try {
    webhookDB(config).then(function(db) {
        stopServer = web(config, db);
    }).catch(function(err) {
        log.error(err);
    });
} catch (err) {
    log.error(err);
}

process.on('unhandledRejection', function(err) {
    log.error(err);
});

process.on('SIGINT', function() {
    stopServer();
});

if (argv.pid) {
    //Write a pid file
    fs.writeFile('./webhooks-tool.pid',process.pid);
}



