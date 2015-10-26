// Webhook Callback Handle
// Handle running scripts when the hook callback is sent
var Promise = require('bluebird');
var spawn = require('child_process').spawn;

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
        var self=this;
        this.db.getHookByHookId(req.body.hookId).then(function(hook) {
            if (hook) {
                req.log.debug({hook: hook}, 'Found matching hook');
                var loggingPromise = self.db.addLogEntry(hook.log, 'Callback recieved', { 
                    event: req.body.eventName,
                    enabled: hook.enabled,
                    script: hook.script
                });

                if (!hook.enabled) {
                    req.log.info('Hook is not enabled, not executing script')
                } else if (!hook.script) {
                    req.log.info('Hook does not have an associated script, not executing');
                } else {
                    var callbackData = req.body
                    callbackData.name = hook.name;
                    callbackData.eventFilter = hook.eventFilter;
                    if (self.config.passServerInfo) {
                        callbackData.apiToken = self.config.apiToken;
                        callbackData.minServer = self.config.minBaseUrl;
                    }

                    Promise.join(
                        self.executeScript(hook, JSON.stringify(callbackData), req.log),
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
                req.log.warn('Recieved callback for hook ' + req.body.hookId + ', but I do not know about that hook');
            }
        });
    },

    //Execute the script associated with the hook
    executeScript: function(hook, data, log) {
    	var dataAsJson = JSON.parse(data);
        var logData = this.config.logCallbackData ? dataAsJson : { name: dataAsJson.name, eventName: dataAsJson.eventName };
        log.debug({logData: logData}, 'Executing script');
        var self = this;

        return Promise.join(
            this.db.addLogEntry(hook.log, 'Executing script', logData),
            this.executeChildProcess({
                stdin: data,
                cmd: hook.script,
                args: [dataAsJson.name, dataAsJson.eventName]
            },log).then(function(result) {
                if (!self.config.logScriptOut) {
                    result.output = 'NOT LOGGED';
                }
                log.debug({result: result}, 'Script complete');
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
    }
};

//Bind handle function
['handle'].forEach(function(method) {
    callbackHandler[method]=callbackHandler[method].bind(callbackHandler);
});

module.exports = callbackHandler;

