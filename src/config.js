//Config
//Handles application configuration

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var log = require('./logger').config;
var normalizeURL = require('./utils').normalizeURL;
var mkdirp = require('mkdirp');

//Default config loaded when application is first started
var initialConfig = {
    isNew: true,
    isSetup: false,
    dbVersion: 0,
    httpPort: 8080,
    product: 'projectmanager',
    leaseTime: 10 * 24 * 60 * 60, //10 days
    leaseLeadTime: 3 * 24 * 60 * 60, //3 days
    logScriptOut: false,
    logCallbackData: false,
    passServerInfo: true,
    minBaseUrl: process.env.WEBHOOK_MIN_BASE_URL,
    externalServerUrl: process.env.WEBHOOK_SERVER_URL,
    apiToken: process.env.WEBHOOK_MIN_API_TOKEN
};



//Keep these around when replacing config
var methods = ['write','reload','replace'];

module.exports = function(dataPath) {
    var configPath = dataPath + '/config.json';
    
    //These methods are added to the config and preserved when
    //replaced/reloaded
    
    //Write config to disk
    var write = function() {
        var self = this;
        return fs.writeFile(configPath, JSON.stringify(this), function(err) {
            if (err) {
                log.error({err: err, path: configPath, config: self},'Could not write configuration file');
            }
        });
    };

    //Reload the config from disk
    var reload = function() {
        fs.readFileAsync(configPath).then(function(file) {
            this.replace(JSON.parse(file));
            return this;
        });
    };

    //Replace config
    var replace = function(newConfig) {
        var key;
        for (key in this) {
            if (methods.indexOf(key) === -1) {
                delete this[key];
            } 
        }

        for(key in newConfig) {
            var newVal = newConfig[key];  

            //If last 3 chars of key is url normalize it
            if (key.substr(-3).toLowerCase() === 'url') {
                newVal = normalizeURL(newVal);
            }

            this[key] = newVal;
        }

        return this.write();
    };

    var config;

    try {
        //Try to load config from disk
        config = JSON.parse(fs.readFileSync(configPath));

        for(key in config) {
            if (key.substr(-3).toLowerCase() === 'url') {
                config[key] = normalizeURL(config[key]);
            }
        }
    } catch (openConfigException) {
        //Create defualt if it doesn't exist
        log.warn('Could not open ' + configPath + '. Assuming new install.');
        try {
            mkdirp.sync(dataPath);
        } catch (makePathException) {
            log.error(makePathException, 'Could not create ' + dataPath + '. Bailing...');
        }
        config = initialConfig;
        
        //This is random data with ~ 100-bits of entropy
        config.cookieSecret = String(Math.floor(Math.random() * 10e15)) + String(Math.floor(Math.random() * 10e15));  

        //Write config to disk
        write.apply(config);
    }

    //These aren't loaded from the disk, but we want them in the config anyway
    config.appPath = fs.realpathSync(__dirname + '/..');
    config.dataPath = dataPath;

    //Bind the config methods to the config object
    config.write = write.bind(config);
    config.reload = reload.bind(config);
    config.replace = replace.bind(config);


    log.debug({config: config}, 'Loaded config');

    return config;
};
