var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var eternalLogin = 'LOGIN_TOKEN=s%3A%7B%22user%22%3A%22admin%22%2C%22id%22%3A%22zQZmDrezttF4Z6AV%22%2C%22expires%22%3A32996211657896%2C%22isLoggedIn%22%3Atrue%7D.i1dqpewfkhT5mTzTkA71yaVljvBKW4%2BP%2Fl5qr2%2F15wk';
var testServer = 'http://localhost:8080';

var singularMap = {
    users: 'user',
    webhooks: 'webhook',
    logEntries: 'logEntry',
    logs: 'log'
};

var initialConfig;

var initialIds = {
    webhooks: [ "kwTSK9dsQnOS1MVn" ],
    users: ["GdO6VUq8BfkUY7cd", "w82evYv7gNf20f5G", "zQZmDrezttF4Z6AV"],
    logs: [ "xTiXDxaubrzfMPXC" ],
    logEntries: [ "W6mwGaviqRW7uQDq", "W6mwGaviqRW7uQDv" ]
};

var expectEqualArrays = function(arrA, arrB) {
    expect(arrA.length).toBe(arrB.length);
    expectContainsAll(arrA, arrB);
    expectContainsAll(arrB, arrA);
};

var expectContainsAll = function(arrA, arrB) {
    arrA.forEach(function(item) {
        expect(arrB).toContain(item);
    });
};

var getExport = function(type) {
    return request({
        url: testServer +  '/api/method/export/' + type,
        headers: { Cookie: eternalLogin },
        encoding: null //For binary data
    }).spread(function(response, body) {
        expect(response.statusCode).toEqual(200);
        expect(response.headers['content-type']).toEqual('application/octet-stream');
        expect(response.headers['content-disposition']).toMatch('^attachment; filename="webhookTool-export-' + type + '-\\d+\\.json\\.gz"$');
        return body;
    });
};

var verifyModel = function(model) {
    return function() {
        return request({
            url: testServer + '/api/' + model,
            headers: { Cookie: eternalLogin }
        }).spread(function(response, body) {
            expect(response.statusCode).toEqual(200);
            expect(response.headers['content-type']).toMatch('application/json');
            var modelIds = JSON.parse(body)[model].map(function(model) {
                return model._id;
            });

            expectEqualArrays(modelIds, initialIds[model]);
        });
    };
};

var changeConfig = function() {
    return request({
        url: testServer + '/api/config',
        method: 'POST',
        headers: {
            Cookie: eternalLogin,
            "Content-Type": 'application/json'
        },
        json: true,
        body: {
            isNew: initialConfig.isNew,
            dbVersion: initialConfig.dbVersion,
            cookieSecret: initialConfig.cookieSecret,
            appPath: initialConfig.appPath,
            dataPath: initialConfig.dataPath,
        }
    });
};

var changeModel = function(model) {
    //Delete all the old items
    var promises = initialIds[model].map(function(id) {
        return request({
            method: 'DELETE',
            url: testServer + '/api/' + model + '/' + id,
            headers: { Cookie: eternalLogin }
        }).spread(function (resp, body) {
            expect(resp.statusCode).toEqual(200);
            expect(resp.headers['content-type']).toMatch('application/json');
            expect(JSON.parse(body)).toEqual({});
        });
    });

    //And add in new ones
    for(var i = 0; i < 20; i++) {
        var newModel = {};
        newModel[singularMap[model]] = {
            this: 'is',
            a: {  test: 'model' }
        };

        promises.push(
            request({
                method: 'POST',
                url: testServer + '/api/' + model,
                headers: { Cookie: eternalLogin },
                json: true,
                body: newModel
            }).spread(function (resp, body) {
                expect(resp.statusCode).toEqual(200);
                expect(resp.headers['content-type']).toMatch('application/json');
                var returnedModel = body[singularMap[model]];
                expect(returnedModel.this).toEqual('is');
                expect(returnedModel.a.test).toEqual('model');
            })
        );
    }

    //The returned promise resolves once all the deletes and additions are complete
    return Promise.all(promises);
}


var getConfig = function() {
    return request({
        url: testServer + '/api/config',
        headers: { Cookie: eternalLogin }
    }).spread(function(response, body) {
        expect(response.statusCode).toEqual(200);
        expect(response.headers['content-type']).toMatch('application/json');
        return JSON.parse(body);
    });
};

var verifyConfig = function() {
    return getConfig().then(function(body) {
        expect(body).toEqual(initialConfig);
    });
};


var uploadImport = function(type, buffer) {
    return function() {
        return request({
            url: testServer +  '/api/method/import/' + type,
            method: 'POST',
            headers: { Cookie: eternalLogin },
            formData: {
                import: {
                    value: buffer,
                    options: {
                        filename: 'upload.json.gz',
                        contentType: 'application/octet-stream'
                    }
                }
            }
        }).spread(function (response, body) {
            expect(response.statusCode).toEqual(200);
            expect(response.headers['content-type']).toMatch('application/json');
            expect(JSON.parse(body).success).toBeTruthy();
        });
    };
};

//Used to wrap the done function since it interprets any aguments as a failure.
var wrap = function(wrappee) {
    return function() {
        wrappee();
    }
};

describe('import output', function() {
    it('config', function(done) {
        var fail = this.fail.bind(this);

        getConfig().then(function(config) {
            initialConfig = config;
            return getExport('config');
        }).then(function(body) {
            return changeConfig().then(uploadImport('config',body));
        }).then(verifyConfig)
        .then(wrap(done))
        .catch(fail);
    });


    it('users', function(done) {
        var fail = this.fail.bind(this);

        getExport('users').then(function(exportData) {
            return changeModel('users').then(uploadImport('users', exportData));
        }).then(verifyModel('users'))
        .then(wrap(done))
        .catch(fail);
    });

    it('webhooks', function(done) {
        var fail = this.fail.bind(this);

        var models = ['webhooks', 'logs', 'logEntries'];
        getExport('webhooks').then(function(exportData) {
            return Promise.all(models.map(changeModel)).then(uploadImport('webhooks', exportData));
        }).then(Promise.all(models.map(verifyModel)))
        .then(wrap(done))
        .catch(fail);
    });

    it('everything', function(done) {
        var fail = this.fail.bind(this);

        var models = ['webhooks', 'logs', 'logEntries', 'users'];
        getConfig().then(function(config) {
            initialConfig = config;
            return getExport('everything');
        }).then(function(exportData) {
            return Promise.all(models.map(changeModel))
            .then(changeConfig)
            .then(uploadImport('everything', exportData));
        }).then(Promise.all(models.map(verifyModel)))
        .then(verifyConfig)
        .then(wrap(done))
        .catch(fail);
    });

});

