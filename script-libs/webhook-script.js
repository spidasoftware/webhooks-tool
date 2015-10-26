var url = require('url');
var http = require('http');
var querystring = require('querystring');

module.exports = {

	/**
	 * convert stdin to a json object and pass into the callback
	 */
	 handleStdinAsJson:function(callback){
	 	var stdin = process.stdin;
	 	var stdout = process.stdout;
	 	var inputChunks = [];

	 	stdin.resume();
	 	stdin.setEncoding('utf8');
	 	stdin.on('data', function (chunk) { 
	 		inputChunks.push(chunk); 
	 	});

	 	stdin.on('end', function () {
	 		var inputJSON = inputChunks.join();
	 		var parsedData = JSON.parse(inputJSON);
	 		callback(parsedData);
	 	});
	 },

	/**
	 * opts = node request options plus xResponseCallBack, xBody, xLog
	 * https://nodejs.org/api/http.html#http_http_request_options_callback
	 */
	 post:function(opts){
	 	var req = http.request(opts, function(res) {
	 		if(opts.xLog){console.log('STATUS: ' + res.statusCode);}
	 		if(opts.xLog){console.log('HEADERS: ' + JSON.stringify(res.headers));}

	 		res.setEncoding('utf8');
	 		var allData = "";

	 		res.on('data', function (chunk) {
	 			allData+=chunk;
	 			if(opts.xLog){console.log('BODY: ' + chunk);}
	 		});

	 		res.on('end', function() {
	 			if(opts.xResponseCallBack){
	 				opts.xResponseCallBack(allData);
	 			}
	 		});
	 	});

	 	req.on('error', function(e) {
	 		throw e;
	 	});

	 	if(opts.xBody){
	 		req.write(opts.xBody);
	 	}
	 	req.end();
	 },

	/**
	 * sends min project changes back to the min server
	 */
	 updateMinProject:function(stdinJsonObj, project, responseCallBack){
	 	var parsedUrl = url.parse(stdinJsonObj.minServer);
		var body = querystring.stringify({
			'project_json' : JSON.stringify(project)
		});

	 	var requestOptions = {
	 		hostname: parsedUrl.hostname,
	 		port: parsedUrl.port,
	 		path: '/projectmanager/projectAPI/createOrUpdate?apiToken='+stdinJsonObj.apiToken,
	 		method: 'POST',
	 		headers: {
	 			'Content-Type': 'application/x-www-form-urlencoded',
			    'Content-Length': body.length
			},
			xResponseCallBack: responseCallBack,
			xBody: body,
			xLog: true
		};

		this.post(requestOptions);
	},

	/**
	 * adds project codes to the min project passed in
	 */
	 addProjectCodes:function(stdinJsonObj, projectCodes, responseCallBack){
	 	var project = {
			id: stdinJsonObj.payload.part.id,
			projectCodes: projectCodes
		};
		this.updateMinProject(stdinJsonObj, project, responseCallBack);
	},

	/**
	 * sets the status of the min project passed in
	 */
	 setStatus:function(stdinJsonObj, newStatus, responseCallBack){
	 	var project = {
			id: stdinJsonObj.payload.part.id,
			status: {
				current: newStatus
			}
		};
		this.updateMinProject(stdinJsonObj, project, responseCallBack);
	},

	/**
	 * adds log messages to the min project passed in
	 */
	 addLogMessage:function(stdinJsonObj, logMessages, responseCallBack){
	 	var project = {
			id: stdinJsonObj.payload.part.id,
			logMessages: logMessages //TODO may need to update name of field based on the new api added
		};
		this.updateMinProject(stdinJsonObj, project, responseCallBack);
	}

};
