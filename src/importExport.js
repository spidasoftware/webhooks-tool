var Promise = require('bluebird');

var log = require('./logger').importExport;
var hookAPI = require('./hookAPI');

var groups = {
    config: ['config'],
    users: ['users'],
    webhooks: ['webhooks', 'logs', 'logEntries'],
    everything: ['config', 'users', 'webhooks', 'logs', 'logEntries']
};

module.exports = {
    init: function(config, db) {
        this.config = config;
        this.db = db;
    },

    exportGroup: function(group) {
        var result = {};
        var self = this;

        groups[group].forEach(function(subType) {
            result[subType] = self.exportData(subType);
        });

        return Promise.props(result).then(function(resolvedResult) {
            return JSON.stringify(resolvedResult);
        });
    },


    exportData: function(type) {
        if (type === 'config') {
            return Promise.resolve(this.config);
        } else {
            return this.db.all(type);
        }
    },

    importGroup: function(group, data) {
        var self = this;
        log.debug('Importing Group: ' + group);
        log.trace(data);
        return new Promise(function(resolve, reject) {
            var parsed;
            try {
                parsed = JSON.parse(data);
                var types = groups[group];

                types.forEach(function(type) {
                    if (!parsed[type]) {
                        throw new Error('Data does not contain: ' + type);
                    }
                });

                resolve(Promise.all(types.map(function(type) {
                    return self.importData(type, parsed[type]);
                })).then(function(result) {
                    //Resync with server if we updated webhooks
                    if (group === 'webhooks' || group === 'everything') {
                        return hookAPI.refresh().then(function() {
                            return result;
                        });
                    } else {
                        return result;
                    }
                }));

            } catch (e) {
                reject(e);
            }
        });
    },

    importData: function(type, data) {
        var self=this;

        if (type === 'config') {
            return this.config.replace(data);
        } else {
            return this.db.clear(type).then(function() {
                return self.db.insertMany(type, data);
            });
        }
    }
};


