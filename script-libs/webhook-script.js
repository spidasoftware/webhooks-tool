var url = require('url');
var http = require('http');
var querystring = require('querystring');

module.exports = {

    extraLogging: false,

    /**
     * Log if extra logging.
     */
    log: function(s){
        if(this.extraLogging){
            console.log(s);
        }
    },

    /**
     * Convert stdin to a json object and pass into the callback.
     */
    doWithStdinJson: function(callback){
        var self = this;
        var stdin = process.stdin;
        var inputChunks = [];

        stdin.resume();
        stdin.setEncoding('utf8');
        stdin.on('data', function (chunk) { 
            inputChunks.push(chunk); 
        });

        stdin.on('end', function () {
            var inputJSON = inputChunks.join("");
            var parsedStdin = JSON.parse(inputJSON);
            self.log("parsedStdin: " + JSON.stringify(parsedStdin));
            callback(parsedStdin);
        });
    },

    /**
     * Finds the value of the field in a form in a min project.
     */
    getFormFieldVal: function(stdinJsonObj, formName, fieldName){
        var minProject = stdinJsonObj.payload.part;
        if(!minProject.dataForms){
            return null;
        }
        var formsFound = minProject.dataForms.filter(function(df){
            return df.title === formName;
        });
        if(formsFound.length === 0){
            return null;
        }
        return formsFound[0].fields[fieldName];
    },

    /**
     * Makes an http request.
     * opts = node request options plus xResponseCallback, xBody
     * https://nodejs.org/api/http.html#http_http_request_options_callback
     */
    httpRequest: function(opts){
        var self = this;
        var req = http.request(opts, function(responseObj) {
            self.log('STATUS: ' + responseObj.statusCode);
            self.log('HEADERS: ' + JSON.stringify(responseObj.headers));

            responseObj.setEncoding('utf8');
            var responseBody = "";

            responseObj.on('data', function (chunk) {
                responseBody += chunk;
                self.log('BODY: ' + chunk);
            });

            responseObj.on('end', function() {
                if(opts.xResponseCallback){
                    opts.xResponseCallback(responseObj, responseBody);
                }
            });
        });

        req.on('error', function(e) {
            console.log("Unable to connect to server.");
            throw e;
        });

        if(opts.xBody){
            req.write(opts.xBody);
        }
        req.end();
    },

    /**
     * Sends min project changes back to the min server.
     */
    updateMinProject: function(stdinJsonObj, project, responseCallback){
        var parsedUrl = url.parse(stdinJsonObj.minServer);
        var body = querystring.stringify({
            'project_json' : JSON.stringify(project)
        });
        
        if(!responseCallback){
            responseCallback = function(responseObj, responseBody){
                if(responseObj.statusCode === 200){
                    var responseBodyObj = JSON.parse(responseBody);
                    if(responseBodyObj.result && responseBodyObj.result.id){
                        console.log("Successfully updated min project.");
                    } else {
                        console.log("Error from min: " + responseBody);
                    }
                } else {
                    throw new Error("Unable to connect to min to update project.");
                }
            };
        }

        var requestOptions = {
            protocol: parsedUrl.protocol,
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: '/projectmanager/projectAPI/createOrUpdate?apiToken=' + stdinJsonObj.apiToken,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': body.length
            },
            xResponseCallback: responseCallback,
            xBody: body
        };

        this.httpRequest(requestOptions);
    },

    /**
     * Adds project codes to the min project passed in.
     */
    postProjectCodesBackToMin: function(stdinJsonObj, projectCodes, responseCallback){
        var project = {
            id: stdinJsonObj.payload.part.id,
            projectCodes: projectCodes
        };
        this.updateMinProject(stdinJsonObj, project, responseCallback);
    },

    /**
     * Sets the status of the min project passed in.
     */
    postStatusBackToMin: function(stdinJsonObj, newStatus, responseCallback){
        var project = {
            id: stdinJsonObj.payload.part.id,
            status: {
                current: newStatus
            }
        };
        this.updateMinProject(stdinJsonObj, project, responseCallback);
    },

    /**
     * Adds log messages to the min project passed in.
     */
    postLogMessagesBackToMin: function(stdinJsonObj, logMessages, responseCallback){
        var project = {
            id: stdinJsonObj.payload.part.id,
            logMessages: logMessages
        };
        this.updateMinProject(stdinJsonObj, project, responseCallback);
    }

};
