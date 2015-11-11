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

    it('postLogBack called from handle when disabled', function() {
        //setup
        var bodyCallbackData = {bodyCallbackData:true};
        var hookFromDb = {enabled:false};
        spyOn(callbackHandler, 'postLogBack').andCallFake(function(hook, callbackData, message, success){
            expect(hook).toEqual(hookFromDb);
            expect(callbackData).toEqual(bodyCallbackData);
            expect(message).toEqual("Webhook is disabled.");
            expect(success).toEqual(false);
        });
        callbackHandler.db = { 
            getHookByHookId:function(){return {then:function(cb){cb(hookFromDb)}};},
            addLogEntry:function(){}
        };
        callbackHandler.config = {passServerInfo: true};
        var req = {body:bodyCallbackData, query:{wait:false}, log:{ info:function(){}, debug:function(){} }};
        var res = {sendStatus:function(){}};
        
        //when
        callbackHandler.handle(req, res);
        
        //then
        expect(callbackHandler.postLogBack).toHaveBeenCalled();
    });

    it('postLogBack called from handle when no script', function() {
        //setup
        var bodyCallbackData = {bodyCallbackData:true};
        var hookFromDb = {enabled:true};
        spyOn(callbackHandler, 'postLogBack').andCallFake(function(hook, callbackData, message, success){
            expect(hook).toEqual(hookFromDb);
            expect(callbackData).toEqual(bodyCallbackData);
            expect(message).toEqual("No script for Webhook.");
            expect(success).toEqual(false);
        });
        callbackHandler.db = { 
            getHookByHookId:function(){return {then:function(cb){cb(hookFromDb)}};},
            addLogEntry:function(){}
        };
        callbackHandler.config = {passServerInfo: true};
        var req = {body:bodyCallbackData, query:{wait:false}, log:{ info:function(){}, debug:function(){} }};
        var res = {sendStatus:function(){}};
        
        //when
        callbackHandler.handle(req, res);
        
        //then
        expect(callbackHandler.postLogBack).toHaveBeenCalled();
    });

    it('postLogBack called from executeScript', function() {
        //setup
        var bodyCallbackData = {bodyCallbackData:true};
        var hookFromDb = {enabled:true};
        var log = { info:function(){}, debug:function(){}, trace:function(){} };
        var postLogBackCallCount = 0;
        var exitCode = 0;
        callbackHandler.config = {logCallbackData: true};
        spyOn(callbackHandler, 'postLogBack').andCallFake(function(hook, callbackData, message, success){
            postLogBackCallCount++;
            expect(hook).toEqual(hookFromDb);
            expect(callbackData).toEqual(bodyCallbackData);

            //first pass through when exit code is 0
            if(postLogBackCallCount==1)expect(message).toEqual("Executing script.");
            if(postLogBackCallCount==2)expect(message).toEqual("Script completed successfully.");
            
            //second pass through when exit code is 1
            if(postLogBackCallCount==3)expect(message).toEqual("Executing script.");
            if(postLogBackCallCount==4)expect(message).toEqual("Script completed but was not successful.  See webhooks tool logs.");
            expect(success).toEqual(postLogBackCallCount < 4);//last call is not successful
        });
        
        spyOn(callbackHandler, 'executeChildProcess').andCallFake(function(options, log){
            return {then:function(cb){cb({exitCode:exitCode});}}
        });
                
        //when
        exitCode = 0;
        callbackHandler.executeScript(hookFromDb, bodyCallbackData, log); //exit code 0
        exitCode = 1;
        callbackHandler.executeScript(hookFromDb, bodyCallbackData, log); //exit code 1
        
        //then
        expect(callbackHandler.postLogBack).toHaveBeenCalled();
    });

});
