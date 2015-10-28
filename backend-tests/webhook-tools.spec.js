var url = require('url');
var http = require('http');
var querystring = require('querystring');
var whs = require("../script-libs/webhook-tools")

var originalStdin = process.stdin;
var originalHttpRequest = whs.httpRequest;
var originalUpdateMinProject = whs.updateMinProject;
var reset = function(){
   Object.defineProperty(process, 'stdin', { value: this.originalStdin });
   whs.httpRequest = originalHttpRequest;
   whs.updateMinProject = originalUpdateMinProject;
};

describe('webhook-tools', function() {
    afterEach(reset);
    beforeEach(reset);

    it('debugLog enableDebugLog = true', function() {
        //setup
        spyOn(console, 'log');
        whs.enableDebugLog = true;
        
        //when
        whs.debugLog('test');

        //then
        expect(console.log).toHaveBeenCalled();
    });

    it('debugLog enableDebugLog = false', function() {
        //setup
        spyOn(console, 'log');
        whs.enableDebugLog = false;
        
        //when
        whs.debugLog('test');
        
        //then
        expect(console.log).not.toHaveBeenCalled();
    });

    it('doWithStdinJson', function() {
        //setup
        Object.defineProperty(process, 'stdin', {  
            value: {
                resume:function(){},
                setEncoding:function(){},
                on:function(evt, func){
                    if(evt === 'data'){
                        func("{");
                        func("}");
                    } else if(evt === 'end'){
                        func();
                    }
                }
            }
        });
        var done = jasmine.createSpy('done');
        
        //when
        whs.doWithStdinJson(done);
        
        //then
        expect(done).toHaveBeenCalledWith(JSON.parse('{}'));
    });

    it('getForm and getFormFieldVal', function() {
        //setup
        var stdinJsonObj = {
            payload:{
                part:{
                    dataForms:[{
                        title: "form1",
                        fields:{
                            field1: "val1"
                        }
                    }]
                }
            }
        };
        
        //when
        var val = whs.getFormFieldVal(stdinJsonObj, "form1", "field1");
        
        //then
        expect(val).toEqual("val1");
        
        //when
        var val = whs.getFormFieldVal(stdinJsonObj, "form1", "MISSING");
        
        //then
        expect(val).toEqual(null);
        
        //when
        stdinJsonObj.payload.part.dataForms = undefined;
        
        //then
        expect(val).toEqual(null);
    });

    it('httpRequest', function() {
        //setup
        var responseObj = {
            statusCode:200, 
            setEncoding: function(){},
            on:function(evt, func){
                if(evt === 'data'){
                    func("{");
                    func("}");
                } else if(evt === 'end'){
                    func();
                }
            }
        };
        var requestEnd = jasmine.createSpy('requestEnd');
        var requestWrite = jasmine.createSpy('requestWrite');
        var requestOn = jasmine.createSpy('requestOn');
        var responseHandler = jasmine.createSpy('responseHandler');
        http.request = function(opts, handler){
            handler(responseObj);
            return {
                end: requestEnd,
                write: requestWrite,
                on: requestOn
            }
        }
        var requestOptions = {
            protocol: "test:",
            hostname: "test",
            port: 123,
            path: '/test',
            method: 'POST',
            headers: {},
            xResponseCallback: responseHandler,
            xBody: 'body'
        };
        
        //when
        whs.httpRequest(requestOptions);
        
        //then
        expect(requestEnd).toHaveBeenCalled();
        expect(requestWrite).toHaveBeenCalled();
        expect(requestOn).toHaveBeenCalled();
        expect(responseHandler).toHaveBeenCalledWith(responseObj, "{}");
    });

    it('updateMinProject', function() {
        //setup
        var stdinJsonObj = {
          "apiToken": "admin@spidasoftware.com",
          "minServer": "http://localhost:8888/"
        };
        var project = {id:1};
        var responseHandler = jasmine.createSpy('responseHandler');
        var calledPost = false;
        spyOn(whs, 'httpRequest').andCallFake(function(opts){
            expect(opts.protocol).toEqual("http:")
            expect(opts.hostname).toEqual("localhost")
            expect(opts.port).toEqual("8888")
            expect(opts.path).toEqual('/projectmanager/projectAPI/createOrUpdate?apiToken=admin@spidasoftware.com')
            expect(opts.method).toEqual("POST")
            expect(opts.headers['Content-Type']).toEqual('application/x-www-form-urlencoded')
            expect(opts.headers['Content-Length']).toEqual(31)
            expect(opts.xResponseCallback).toEqual(responseHandler)
            expect(opts.xBody).toEqual("project_json=%7B%22id%22%3A1%7D")
            calledPost = true;
        });

        //when
        whs.updateMinProject(stdinJsonObj, project, responseHandler);
        
        //then
        expect(calledPost).toBeTruthy();
    });

    it('postProjectCodesBackToMin', function() {
        //setup
        var stdinJsonObj = {payload:{part:{id:1}}};
        var projectCodes = [{value:"123"}];
        spyOn(whs, 'updateMinProject').andCallFake(function(){});
        
        //when
        whs.postProjectCodesBackToMin(stdinJsonObj, projectCodes);
        
        //then
        expect(whs.updateMinProject).toHaveBeenCalled();
    });

    it('postStatusBackToMin', function() {
        //setup
        var stdinJsonObj = {payload:{part:{id:1}}};
        spyOn(whs, 'updateMinProject').andCallFake(function(){});
        
        //when
        whs.postStatusBackToMin(stdinJsonObj, "Finish");
        
        //then
        expect(whs.updateMinProject).toHaveBeenCalled();
    });

    it('postLogMessageBackToMin', function() {
        //setup
        var stdinJsonObj = {payload:{part:{id:1}}, minServer:"http://test/test"};
        var logMessage = {trigger:"test", message:"test", success:true, date:new Date().getTime()};
        spyOn(whs, 'httpRequest').andCallFake(function(){});
        
        //when
        whs.postLogMessageBackToMin(stdinJsonObj, logMessage);
        
        //then
        expect(whs.httpRequest).toHaveBeenCalled();
    });

});
