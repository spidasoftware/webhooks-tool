var rewire = require("rewire");
var callbackHandler = rewire("../src/callbackHandler");


var originalConfig = callbackHandler.config;
var reset = function(){
    callbackHandler.config = originalConfig;
}

describe('callbackHandler', function() {
    afterEach(reset);
    beforeEach(reset);

    it('postLogBack', function() {
        //setup
        var requestWithLogCallCount = 0;
        var hook = {channel:'ccc', eventFilter:'fff'};
        var callbackData = {payload:{projectId:123}};
        callbackHandler.config = {product:"projectmanager", externalServerUrl:"http://externalServerUrl", apiToken:"ABC123", minBaseUrl:"http://minBaseUrl"};

        callbackHandler.__set__('requestWithLog', function(opts){
            expect(opts.url).toEqual('http://minBaseUrl/projectmanager/projectAPI/addLogMessage');
            expect(opts.method).toEqual('POST');
            expect(opts.form.apiToken).toEqual('ABC123');
            expect(opts.form.log_message_json).toEqual(JSON.stringify({
                trigger:'Webhooks Tool', 
                message:"testing123 (Channel:ccc, Filter:fff, URL:http://externalServerUrl/callback)", 
                success:true
            }));
            requestWithLogCallCount++;
        });
        
        //when
        callbackHandler.postLogBack(hook, callbackData, "testing123", true);
        
        //then
        expect(requestWithLogCallCount).toEqual(1);
    });
});
