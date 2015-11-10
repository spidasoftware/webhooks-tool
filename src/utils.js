//Webhook API
//Handles communication with min and scheduling or webhook renewal
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var log = require('./logger').hook;

var requestId = 0;

module.exports = {

    requestWithLog: function(options) {
        //Wraps request.js with a version that logs request and response
        var id = requestId++;
        log.debug({id: id, requestOptions: options}, 'Outgoing Request');
        return request(options).spread(function (response, body) {
            log.debug({id: id, response: response}, 'Incoming Response');
            return [response, body];
        });
    },

    normalizeURL: function(url) {
        if(url){
            url = url.trim();
            if (url.substr(-1) !== '/') {
                url += '/';
            }
        }
        return url;
    }
    
};
