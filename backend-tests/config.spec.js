config = require("../src/config")

describe('config', function() {
    it('reads config file', function() {
        var testConfig = config(__dirname + '/../tests/data/');
		expect(testConfig.externalServerUrl).toEqual("http://localhost:8080/");
		expect(testConfig.minBaseUrl).toEqual("http://localhost:8081/");
        expect(testConfig.isNew).toBeFalsy();
        expect(testConfig.dbVersion).toEqual(0);
        expect(testConfig.httpPort).toEqual(8080);
        expect(testConfig.product).toEqual("projectmanager");
        expect(testConfig.cookieSecret).toEqual("NOMNOMNOM");
        expect(testConfig.leaseTime).toEqual(1200);
        expect(testConfig.leaseLeadTime).toEqual(200);
	});
    
    it('normalizes urls on replace', function() {
        //Do not use the path from above since data in this file will be
        //overwritten with replace call below
        var testConfig = config(__dirname + '/../test-data/');
        testConfig.replace({
            minBaseUrl: 'http://missingslash',
            externalServerUrl: 'https://notmissingslash/',
            normalProperty: 'not a url'
        });
        expect(testConfig.minBaseUrl).toEqual('http://missingslash/');
        expect(testConfig.externalServerUrl).toEqual('https://notmissingslash/');
        expect(testConfig.normalProperty).toEqual('not a url');
	});
});
