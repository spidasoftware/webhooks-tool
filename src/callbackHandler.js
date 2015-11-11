// Webhook Callback Handle
// Handle running scripts when the hook callback is sent
var Promise = require('bluebird');
var spawn = require('child_process').spawn;
var requestWithLog = require('./utils').requestWithLog;
var normalizeURL = require('./utils').normalizeURL;

var errorTranslations = {
    "write EPIPE": "Could not write to script STDIN, most likely this means we could not execute the script"
};

var callbackHandler = {
    init: function(config, db) {
        this.config = config;
        this.db = db;
    },

    //Web request handler
    handle: function(req, res) {
        if (!req.query.wait) {
            //Unless the wait query parameter is passed respond right away
            //since min ignores anything in the response.
            //The wait param is used for testing, since we don't know how long the script will take
            res.sendStatus(200);
        }
        var self = this;
        this.db.getHookByHookId(req.body.hookId).then(function(hook) {
            if (hook) {
                req.log.debug({hook: hook}, 'Found matching hook');
                
                var loggingPromise = self.db.addLogEntry(hook.log, 'Callback received', { 
                    event: req.body.eventName,
                    enabled: hook.enabled,
                    script: hook.script
                });

                var callbackData = req.body
                callbackData.name = hook.name;
                callbackData.eventFilter = hook.eventFilter;
                callbackData.scriptParam = hook.scriptParam;
                if (self.config.passServerInfo) {
                    callbackData.apiToken = self.config.apiToken;
                    callbackData.minServer = self.config.minBaseUrl;
                }

                if (!hook.enabled) {
                    req.log.info('Hook is not enabled, not executing script')
                    self.postLogBack(hook, callbackData, "Webhook is disabled.", false);

                } else if (!hook.script) {
                    req.log.info('Hook does not have an associated script, not executing');
                    self.postLogBack(hook, callbackData, "No script for Webhook.", false);
                    
                } else {
                    Promise.join(
                        self.executeScript(hook, callbackData, req.log),
                        loggingPromise
                    ).then(function() {
                        if (req.query.wait) {
                            //If the wait query parameter is passed respond
                            //since we didn't send it earlier
                            //It is used for testing, since we don't know how long the script will take
                            res.sendStatus(200);
                        }
                    });
                }
            } else {
                req.log.warn('Received callback for hook ' + req.body.hookId + ', but I do not know about that hook');
            }
        });
    },

    //Execute the script associated with the hook
    executeScript: function(hook, callbackData, log) {
        var self = this;
        
        var logData = this.config.logCallbackData ? callbackData : { name: callbackData.name, eventName: callbackData.eventName };
        log.debug({logData: logData}, 'Executing script');
        self.postLogBack(hook, callbackData, "Executing script.", true);                

        return Promise.join(
            this.db.addLogEntry(hook.log, 'Executing script', logData),
            this.executeChildProcess({
                stdin: JSON.stringify(callbackData),
                cmd: hook.script,
                args: [callbackData.name, callbackData.eventName]
            },log).then(function(result) {
                if (!self.config.logScriptOut) {
                    result.output = 'NOT LOGGED';
                }
                log.debug({result: result}, 'Script complete');
                if(result.exitCode === 0){
                    self.postLogBack(hook, callbackData, "Script completed successfully.", true);
                } else {
                    self.postLogBack(hook, callbackData, "Script completed but was not successful.  See webhooks tool logs.", false);
                }
                return self.db.addLogEntry(hook.log, 'Script complete', result);
            })
        );
    },

    //Forks a child process and returns a promise that resolves when it is complete
    executeChildProcess: function(options, log) {
        return new Promise(function (resolve, reject) {
            try {
                log.trace({options: options},'Spawning child process');
                var child = spawn(options.cmd, options.args);

                var errorHandler = function(err) {
                    log.trace({err: err}, 'Error running child process');
                    if (errorTranslations[err.message]) {
                        err.display=errorTranslations[err.message];
                    } else {
                        err.display=err.message;
                    }

                    reject(err);
                };

                child.on('error', errorHandler);
                child.stdin.on('error', errorHandler);
                child.stdout.on('error', errorHandler);
                child.stderr.on('error', errorHandler);

                child.stdout.setEncoding('utf8');
                child.stderr.setEncoding('utf8');

                //This could probably be done more efficiently by not using 'flowing' mode
                var childOutput = '';
                child.stdout.on('data', function(data) {
                    childOutput += data;
                });

                child.stderr.on('data', function(data) {
                    childOutput += data;
                });

                child.on('exit', function(code) {
                    log.trace({code: code, childOutput: childOutput}, 'Child process exit');
                    resolve({
                        exitCode: code,
                        output: childOutput
                    });
                });

                child.stdin.end(options.stdin + "\n");

                log.trace('Done writing STDIN of child process');

            } catch (e) {
                reject(e);
            }
        });
    },

    postLogBack: function(hook, callbackData, message, success){
        if(this.config.product === "projectmanager"){
            var localUrl = normalizeURL(this.config.externalServerUrl) + 'callback';
            message+=' (Channel:' + hook.channel + ', Filter:' + hook.eventFilter + ', URL:' + localUrl + ')';
            requestWithLog({
                url: normalizeURL(this.config.minBaseUrl) + 'projectmanager/projectAPI/addLogMessage',
                method: 'POST',
                form: {
                    apiToken: this.config.apiToken,
                    log_message_json: JSON.stringify({trigger: "Webhooks Tool", message: message, success: success}),
                    project_id: callbackData.payload.projectId
                }
            });
        }
    }
};

//Bind handle function
['handle'].forEach(function(method) {
    callbackHandler[method]=callbackHandler[method].bind(callbackHandler);
});

module.exports = callbackHandler;

