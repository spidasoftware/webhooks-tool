var Promise = require('bluebird');
var fs=Promise.promisifyAll(require('fs'));
var log = require('./logger').config;
var mkdirp = require('mkdirp');

var initialConfig = {
    isNew: true,
    isSetup: false,
    dbVersion: 0,
    httpPort: 8080,
    product: 'projectmanager',
    cookieSecret: 'NOMNOMNOM',
    leaseTime: 600,
    leaseLeadTime: 60,
    logScriptOut: false,
    logCallbackData: false,
    passServerInfo: true
};

var methods = ['write','reload','replace'];

module.exports = function(dataPath) {
    var configPath = dataPath + '/config.json';
    var write = function() {
        return fs.writeFile(configPath, JSON.stringify(this), function() {
            //TODO catch an error here.
        });
    };

    var reload = function() {
        fs.readFileAsync(configPath).then(function(file) {
            this.replace(JSON.parse(file));
            return this;
        });
    };

    var replace = function(newConfig) {
        var key;
        for (key in this) {
            if (methods.indexOf(key) === -1) {
                delete this[key];
            } 
        }

        for(key in newConfig) {
            this[key] = newConfig[key];
        }

        return this.write();
    };

    var config;

    try {
        config = JSON.parse(fs.readFileSync(configPath));
    } catch (openConfigException) {
        log.warn('Could not open ' + configPath + '. Assuming new install.');
        try {
            mkdirp.sync(dataPath);
        } catch (makePathException) {
            log.error(makePathException, 'Could not create ' + dataPath + '. Bailing...');
        }
        config = initialConfig;
        write.apply(config);
    }

    config.appPath = fs.realpathSync(__dirname + '/..');
    config.dataPath = dataPath;
    config.write = write.bind(config);
    config.reload = reload.bind(config);
    config.replace = replace.bind(config);


    log.debug({config: config}, 'Loaded config');

    return config;
};
