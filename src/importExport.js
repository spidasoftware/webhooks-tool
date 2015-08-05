//Import Export
//Handles the import export functionality on the admin page
var Promise = require('bluebird');

var log = require('./logger').importExport;
var hookAPI = require('./hookAPI');

//Defines a mapping of export group to collections
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

    //Returns a promise that resolves to a JSON string which represents all the
    //data in the given group
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


    //Returns the data in the specified type
    exportData: function(type) {
        if (type === 'config') {
            return Promise.resolve(this.config);
        } else {
            return this.db.all(type);
        }
    },

    //The inverse of exportGroup -- Returns a promise that is resolved once all
    //the the data for the specified group is imported
    //data should be the JSON string that is the result of exportGroup(group)
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

    //The inverse of exportData
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


