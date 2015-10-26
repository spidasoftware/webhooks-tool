config = require("../src/config")

describe('config', function() {
    it('reads config file', function() {
        config = config(__dirname + '/../tests/data/');
		expect(config.externalServerUrl).toEqual("http://localhost:8080/");
		expect(config.minBaseUrl).toEqual("http://localhost:8081/");
        expect(config.isNew).toBeFalsy();
        expect(config.dbVersion).toEqual(0);
        expect(config.httpPort).toEqual(8080);
        expect(config.product).toEqual("projectmanager");
        expect(config.cookieSecret).toEqual("NOMNOMNOM");
        expect(config.leaseTime).toEqual(1200);
        expect(config.leaseLeadTime).toEqual(200);
	});
    
    it('normalizes urls on replace', function() {
        config.replace({
            minBaseUrl: 'http://missingslash',
            externalServerUrl: 'https://notmissingslash/',
            normalProperty: 'not a url'
        });
        expect(config.minBaseUrl).toEqual('http://missingslash/');
        expect(config.externalServerUrl).toEqual('https://notmissingslash/');
        expect(config.normalProperty).toEqual('not a url');
	});
});
