var hookAPI = require("../src/hookAPI");

describe('hookAPI', function() {

    it('getRemoteURL', function() {
    	hookAPI.config = {};
    	hookAPI.config.product = "pro";
    	hookAPI.config.apiToken = "abc123";
    	hookAPI.config.minBaseUrl = "http://localhost:8080/";
		expect(hookAPI.getRemoteURL("act")).toEqual("http://localhost:8080/pro/webhookAPI/act?apiToken=abc123");
	});

    it('getLocalURL', function() {
    	hookAPI.config = {};
    	hookAPI.config.externalServerUrl = "http://localhost:8888/";
		expect(hookAPI.getLocalURL()).toEqual("http://localhost:8888/callback");
	});
    
});
