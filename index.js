#!/usr/bin/env node
var dataPath = __dirname + '/data';

var config = require('./src/config')(dataPath);
var webhookDB = require('./src/db');
var web = require('./src/web');
var log = require('./src/logger').main;

try {
    webhookDB(config).then(function(db) {
        web(config, db);
    }).catch(function(err) {
        log.error(err);
    });
} catch (err) {
    log.error(err);
}

process.on('unhandledRejection', function(err) {
    log.error(err);
});


