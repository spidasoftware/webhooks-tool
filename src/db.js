//DB
//Handles data persistance
var Promise=require('bluebird');
var Datastore=require('nedb');
var hash = require('./login').hash;
var log = require('./logger').db;

Promise.promisifyAll(Datastore.prototype);

//This is called when creating the initial DB
var onNewDB = function(config, db) {
    log.info('Creating new DB');

    config.isNew=false;

    return db.insert('users', {name: 'admin', password: hash('changemeplease')})
    .then(config.write)
    .then(function() { return db; });
};

//Wraps x in an array if it isn't one already
var arrayWrap = function(x) {
    if (Object.prototype.toString.call(x) === '[object Array]' ) {
        return x;
    } else {
        return [x];
    }
};

module.exports = function(config) {
    //The collections used by the app
    var stores = {
        users: new Datastore({
            filename: config.dataPath + '/users.db',
            autoload: true
        }),
        webhooks: new Datastore({
            filename: config.dataPath + '/hooks.db',
            autoload: true
        }),
        logs: new Datastore({
            filename: config.dataPath + '/logs.db',
            autoload: true
        }),
        logEntries: new Datastore({
            filename: config.dataPath + '/logEntries.db',
            autoload: true
        })
    };

    var db={
        //Some needed non-REST methods
        //Returns a user if name and hasedPassword match a user
        loginUser: function(name, hashedPassword) {
            return stores.users.findOneAsync({name: name, password: hashedPassword});
        },
        //Useed to update a webhooks leaseEnd when it is renewed
        webhookLeaseEnd: function(hookId, leaseEnd) {
            return stores.webhooks.updateAsync({hookId: hookId}, {$set: {leaseEnd: leaseEnd}});
        },

        //Get a wehook by it's hookId
        getHookByHookId: function(hookId) {
            return stores.webhooks.findOneAsync({hookId: hookId});
        },

        //Add a log entry to a log
        addLogEntry: function(logId, message, data) {
            var newEntry = {
                timestamp: Date.now(),
                message: message,
                entryData: data
            };

            return stores.logEntries.insertAsync(arrayWrap(newEntry)).then(function(logEntry) {
                return stores.logs.updateAsync({_id: logId}, {$push: { logEntries: logEntry[0]._id } });
            });
        },

        //REST Methods
        findById: function(model, id) {
            log.trace({model: model, id: id}, 'Find by Id')
            return stores[model].findOneAsync({_id: id});
        },
        findByIds: function(model, ids) {
            log.trace({model: model, ids: ids}, 'Find by Ids')
            return stores[model].findAsync({_id: { $in: ids }});
        },
        all: function(model) {
            log.trace('Getting all ' + model);
            return stores[model].findAsync({});
        },
        update: function(model, id, o) {
            log.trace({model: model, id: id, object: o}, 'Updating');
            return stores[model].updateAsync({_id: id}, o).then(function() {
                o._id = id;
                return o;
            });
        },
        insert: function(model, o) {
            log.trace({model: model, object: o}, 'inserting');
            return stores[model].insertAsync(arrayWrap(o)).then(function(result) {
                return result[0];
            });
        },
        insertMany: function(model, data) {
            log.trace({model: model, data: data}, 'Inserting many');
            return stores[model].insertAsync(data);
        },
        delete: function(model, id) {
            log.trace({model: model, id: id}, 'Deleting');
            return stores[model].removeAsync({_id: id});
        },
        clear: function(model) {
            log.info('Clearing ' + model + ' from the DB');
            return stores[model].removeAsync({},{multi: true});
        }

    };

    if (config.isNew) {
        return onNewDB(config, db).then(function(db) {
            log.info('DB Ready');
            return db;
        });
    } else {
        log.info('DB Ready');
        return Promise.resolve(db);
    }
};
