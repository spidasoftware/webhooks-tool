#!/usr/bin/env node
//NOTE: this script must be executable: chmod +x script-file-name-here
var whs = require('../script-libs/webhook-script.js');

whs.doWithStdinJson(function(stdinJsonObj){

    //log some data passed into this script
    var spidaminProject = stdinJsonObj.payload.part;
    console.log("SPIDAmin API Token: " + stdinJsonObj.apiToken);
    console.log("SPIDAmin Server: " + stdinJsonObj.minServer);
    console.log("SPIDAmin Project: " + JSON.stringify(spidaminProject));
    console.log("All data passed into this script: " + JSON.stringify(stdinJsonObj));

    //prepare the body of the post
    var body = querystring.stringify({
        'spidaminProject' : JSON.stringify(spidaminProject)
    });

    //post spida project to another server
    whs.httpRequest({
        protocol: 'http:'
        hostname: 'my.other.server',
        port: 8080,
        path: 'my/path',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': body.length
        },
        xBody: body,
        xResponseCallback: function(response, body){
            //handle the response from the other server
            console.log("response statusCode: " + response.statusCode);
            console.log("response body: " + body);
        }
    })
});
