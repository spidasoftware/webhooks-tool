//Webhook API
//Handles communication with min and scheduling or webhook renewal
var Promise = require('bluebird');
var requestWithLog = require('./utils').requestWithLog;
var normalizeURL = require('./utils').normalizeURL;
var log = require('./logger').hook;

//Get the webhook from the array with that hookId
var findByHookId = function(arr, hookId) {
    for(var i=0; i<arr.length; i++) {
        var hook = arr[i];
        if (hook.hookId === hookId) {
            return hook;
        }
    }
    return false;
};

//Rejects the promise if min returns a response with success == false
var rejectOnFailure = function(response) {
    if (response.success) {
        return response;
    } else {
        return Promise.reject(response.message);
    }
};

var hookAPI = {
    init: function(config, db) {
        this.config = config;
        this.db = db;
        if (this.config.minBaseUrl && this.config.externalServerUrl) {
            //Sync local webhooks with remote webhooks
            return this.refresh();
        } else {
            return Promise.reject('Missing configuration');
        }
    },

    //Resync the webhooks in the DB with Min and schedule any renewals before
    //they timeout
    refresh: function() {
        var self = this;
        return this.sync().then(function() {
            //Then find all current webhooks
            return self.db.all('webhooks');
        }).then(function(webhooks) {
            //And schedule a renewal for anthing not yet scheduled
            webhooks.filter(function(hook) {
                return hook.hookId && !self.pendingRenewals[hook.hookId];
            }).forEach(function(hook) {
                self.scheduleRenewal(hook.hookId, hook.leaseEnd);
            });
        });
    },

    //Sync local webhooks with ones in Min
    sync: function() {
        var self = this;

        return Promise.join(this.db.all('webhooks'), this.getRemote(), function(localHooks, remoteHooks) {
            //This finds all remote changes that need to be done, and returns a
            //promise that is resolved when each change is completed
            return Promise.all([].concat(
                //Missing remote hooks
                localHooks.map(function(local) {
                    var remoteHook = findByHookId(remoteHooks, local.hookId);
                    
                    //If we have the remote hook locally
                    if (remoteHook) {
                        if (remoteHook.leaseEnd === local.leaseEnd) {
                            //If leaseEnd matches we are good.
                            return Promise.resolve(local);
                        } else {
                            //Otherwise update the leaseEnd on the local DB
                            local.leaseEnd = remoteHook.leaseEnd;
                            return self.db.update('webhooks',local._id,local);
                        }
                    } else {
                        log.debug({localHook: local}, 'Syncing local -> remote');
                        //Otherwise, create the hooks remotely
                        return self.update(local); 
                    }
                    
                }),

                //+ Missing local hooks
                remoteHooks.filter(function(remote) {
                    //Find remoteHooks that don't exist locally
                    return !findByHookId(localHooks, remote.hookId);
                }).map(function(remote) {
                    log.debug({hookId: remote.hookId}, "Sync: delete missing local from remote");
                    //Remove the hooks remotely
                    return self.delete(remote.hookId, 'hookId');
                })
            ));
        });
    },
    
    //Gets all remote webhooks for this server
    getRemote: function() {
        return this.remoteAction('view', { 
            url: this.getLocalURL()
        }).then(function(body) {
            return body.webhooks;
        });
    },

    //----------Rest API update triggers--------------
    //These are called by the rest API with an update, create, or delete
    //happens to a webhook so we can keep the min server in sync
    update: function(hook) {
        log.debug({hook: hook},'hook update'); 
        
        return this.register(hook);
    },

    delete: function(id, type) {
        var self = this;
        type = type || 'id';

        log.debug({id: id},'hook delete'); 

        if (type === 'id') {
            return this.db.findById('webhooks',id).then(function(hook) {
                if (hook) {
                    self.cancelRenewal(hook._id);
                    return self.remoteAction('unregister',{hookId: hook.hookId}).then(rejectOnFailure);
                } else {
                    return true;
                }
            });
        } else if (type === 'hookId') {
            return self.remoteAction('unregister',{hookId: id}).then(rejectOnFailure)
        }
    },

    create: function(hook) {
        log.debug({hook: hook},'hook create'); 

        return this.register(hook);
    },
    //--------------------------------------------------
    
    //Register a webhook
    register: function(hook) {
        log.debug({hook: hook}, 'registering');

        var request = {
            url: this.getLocalURL(),
            channel: hook.channel,
            eventFilter: hook.eventFilter,
            leaseTime: this.config.leaseTime
        };

        if (hook.hookId) {
            request.hookId = hook.hookId;
        }

        var self = this;

        return this.remoteAction('register', request)
            .then(rejectOnFailure)
            .then(function(response) {
                hook.hookId = response.hookId;
                hook.leaseEnd = response.leaseEnd;

                self.scheduleRenewal(response.hookId, response.leaseEnd);
                return hook;
            });
    },
    
    //Execute webhookAPI action
    remoteAction: function(action, requestBody) {
        return requestWithLog({
            url: this.getRemoteURL(action),
            method: 'POST',
            json: true,
            body: requestBody,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Webhooks-Tool'
            }
        }).spread(function(response, body) {
            return body;
        });
    },

    //Get configured urls
    getRemoteURL: function(action) {
        return normalizeURL(this.config.minBaseUrl) + this.config.product + '/webhookAPI/' + action + '?apiToken=' + this.config.apiToken;
    },
    getLocalURL: function() {
        return normalizeURL(this.config.externalServerUrl) + 'callback';
    },

    //pendingRenewals contains a map of hookId -> the promise that is resolved
    //when a webhook is renewed (so, that it can be cancelled if needed)
    pendingRenewals: {},
    cancelRenewal: function(hookId) {
        //If we have a pending renewal for the hook
        if (this.pendingRenewals[hookId]) {
            //cancel and remove it
            log.info('Canceling renewal for ' + hookId);
            this.pendingRenewals[hookId].cancel('Renewal cancelled');
            delete this.pendingRenewals[hookId];
        }
    },
    scheduleRenewal: function(hookId, leaseEnd) {
        //If the renewal will happen in the future
        if (leaseEnd > Date.now()) {
            var self = this;
            var renewTime = (leaseEnd - (this.config.leaseLeadTime * 1000)) - Date.now();

            log.info({renewTime: renewTime, hookId: hookId}, 'Scheduling renewal');

            //Cancel the old one
            this.cancelRenewal(hookId);

            //Schedule a new one
            this.pendingRenewals[hookId]=Promise.delay(renewTime)
                .cancellable()
                .then(function() {
                    //Send request to min to renew the webhook
                    return self.remoteAction('renew',{
                        hookId: hookId,
                        leaseTime: self.config.leaseTime
                    })
                }).then(rejectOnFailure)
                .then(function(response) {
                    self.scheduleRenewal(hookId, response.leaseEnd);
                    return self.db.webhookLeaseEnd(hookId, response.leaseEnd);
                }).catch(function(err) {
                    //Eat the error thrown when we cancel the renewal
                    if (err !== 'Renewal cancelled') {
                        throw err;
                    }
                });

        } else {
            log.warn({hookId: hookId, leaseEnd: leaseEnd}, 'Not scheduling renewal, it is in the past');
        }
    },

    //Cancel all pending renewals
    destroy: function() {
        for(hookId in this.pendingRenewals) {
            this.cancelRenewal(hookId);
        }
    }
};

//Bind any methods that may be called outside of the correct context
['update','delete','create','scheduleRenewal'].forEach(function(method) {
    hookAPI[method]=hookAPI[method].bind(hookAPI);
});

module.exports = hookAPI;
