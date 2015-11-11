var rewire = require("rewire");
var utils = rewire("../src/utils");

var reset = function(){};

describe('utils', function() {
    afterEach(reset);
    beforeEach(reset);

    it('requestWithLog', function() {
        //setup
        var logDebugCallCount = 0;
        var requestCallCount = 0;
        utils.__set__("log", {debug:function(opts, str){
            logDebugCallCount++;
            if(logDebugCallCount==1)expect(str).toEqual('Outgoing Request');
            if(logDebugCallCount==2)expect(str).toEqual('Incoming Response');
        }});
        utils.__set__("request", function(opts){
            requestCallCount++;
            expect(opts.url).toEqual('http://www.spidasoftware.com/test');
            return {spread:function(cb){cb();}};
        });

        //when
        utils.requestWithLog({url: 'http://www.spidasoftware.com/test'});

        //then
        expect(requestCallCount).toEqual(1);
        expect(logDebugCallCount).toEqual(2);
    });

    it('normalizeURL', function() {
        expect(utils.normalizeURL("asd")).toEqual("asd/");  //added slash
        expect(utils.normalizeURL("asd/")).toEqual("asd/");  //existing slash
        expect(utils.normalizeURL(" asd/ ")).toEqual("asd/");  //trim
    });

});
