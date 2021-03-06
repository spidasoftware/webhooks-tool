var frisby = require('frisby');
var eternalLogin = 'LOGIN_TOKEN=s%3A%7B%22user%22%3A%22admin%22%2C%22id%22%3A%22zQZmDrezttF4Z6AV%22%2C%22expires%22%3A32996211657896%2C%22isLoggedIn%22%3Atrue%7D.i1dqpewfkhT5mTzTkA71yaVljvBKW4%2BP%2Fl5qr2%2F15wk';
var testServer = 'http://localhost:8080';
var mockMin = 'http://localhost:8081';

frisby.globalSetup({
    request: {
        headers: { Cookie: eternalLogin }
    }
});

var now = Date.now()
frisby.create('NoRead -- Create logEntry')
    .post(testServer + '/api/logEntries', {
        logEntry: {
            timestamp: now,
            message: 'Created Test webhook',
            entryData: {}
        }
    }, {json: true})
    .expectStatus(200)
    .expectHeaderContains('content-type', 'application/json')
    .expectJSON('logEntry', {
        timestamp: now,
        message: 'Created Test webhook',
        entryData: {}
    })
    .afterJSON(function(leResp) {
        frisby.create('Create Log')
            .post(testServer + '/api/logs', {
                log: {
                    logEntries: [leResp.logEntry._id]
                }
            }, {json: true})
            .expectStatus(200)
            .expectHeaderContains('content-type', 'application/json')
            .afterJSON(function(logResp) {
                frisby.create('NoRead -- Create Webhook')
                    .post(testServer + '/api/webhooks', {
                        webhook: {
                            name: 'TEST WEBHOOK NOREAD',
                            channel: 'Project',
                            eventFilter: '.*',
                            script: './tests/scripts/noRead.sh',
                            log: logResp.log._id,
                            enabled: true
                        }
                    }, {json: true})
                    .expectStatus(200)
                    .expectHeaderContains('content-type', 'application/json')
                    .expectJSON('webhook',{
                        name: 'TEST WEBHOOK NOREAD',
                        channel: 'Project',
                        eventFilter: '.*',
                        script: './tests/scripts/noRead.sh',
                        enabled: true
                    })
                    .afterJSON(function(webhookResp) {
                        frisby.create('NoRead -- Test callback')
                            .post(testServer + '/callback?wait=true', {
                                channel: 'Project',
                                eventName: 'TEST EVENT',
                                hookId: webhookResp.webhook.hookId,
                                timestamp: Date.now(),
                                payload: {}
                            }, {json:true})
                            .expectStatus(200)
                            .after(function() {
                                frisby.create('NoRead -- Verify log entries added')
                                    .get(testServer + '/api/logs/' + logResp.log._id)
                                    .expectStatus(200)
                                    .expectHeaderContains('content-type', 'application/json')
                                    .expectJSONLength('log.logEntries', 4)
                                .toss();


                                frisby.create('NoRead -- Delete webhook')
                                    .delete(testServer + '/api/webhooks/' + webhookResp.webhook._id)
                                    .expectStatus(200)
                                    .expectHeaderContains('content-type', 'application/json')
                                    .expectJSON({})
                                    .afterJSON(function() {
                                        frisby.create('NoRead -- Verify webhook deleted')
                                            .get(testServer + '/api/webhooks/' + webhookResp.webhook._id)
                                            .expectStatus(404)
                                        .toss();

                                        frisby.create('NoRead -- Verify webhook unregistered')
                                            .get(mockMin + '/~webhooks')
                                            .afterJSON(function(webhooks) {
                                            })
                                        .toss();
                                    })
                                .toss();
                            })
                        .toss();
                    })
                .toss();
            })
        .toss();
    })
.toss();
