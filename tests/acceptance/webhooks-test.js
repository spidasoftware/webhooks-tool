import Ember from 'ember';
import { module, test } from 'qunit';
import startApp from 'webhooks-tool/tests/helpers/start-app';
/* global login */

var application;

module('Acceptance | webhooks', {
  beforeEach: function() {
    application = startApp();
  },

  afterEach: function() {
    Ember.run(application, 'destroy');
  }
});

test('visiting /webhooks', function(assert) {
  visit('/webhooks');

  login(assert);

  andThen(function() {
    assert.equal(currentURL(), '/webhooks');
  });
});

test('verify content on webhooks page', function(assert) {
    visit('/webhooks');

    login(assert);

    andThen(function() {
        assert.equal(find('a.button:contains(New)').length, 1, 'New button is shown');
        assert.equal(find('th:contains(Name)').length, 1, 'Name header is shown');
        assert.equal(find('th:contains(Channel)').length, 1, 'Channel header is shown');
        assert.equal(find('th:contains(Event Filter)').length, 1, 'Event Filter header is shown');
        assert.equal(find('th:contains(Script)').length, 1, 'Script header is shown');
        var testWebhookRow = find('tr:contains(Test Webhook)');
        assert.equal(testWebhookRow.length, 1, 'Test webhook row exists');
        assert.equal(find('td:eq(0)', testWebhookRow).text(), 'Test Webhook');
        assert.equal(find('td:eq(1)', testWebhookRow).text(), 'Project');
        assert.equal(find('td:eq(2)', testWebhookRow).text(), '.*');
        assert.equal(find('td:eq(3)', testWebhookRow).text(), './tests/scripts/test.sh');
        assert.equal(find('a.button:contains(Edit/View)', testWebhookRow).length, 1, 'Edit/View button exists');
        assert.equal(find('a.button:contains(Delete)', testWebhookRow).length, 1, 'Delete button exists');
    });

    click('#logout');
});

test('new webhook', function(assert) {
    visit('/webhooks');

    var webhookName = 'TEST WEBHOOK--' + Math.floor(Math.random() * 1000);

    login(assert);

    andThen(function() {
        click('a.button:contains(New)');
    });

    andThen(function() {
        fillIn('.row:contains(Name) input',webhookName);
        fillIn('.row:contains(Script) input','testScript.py');
    });

    andThen(function() {
        click('a.button:contains(Save)');
    });

    andThen(function() {
        assert.equal(currentURL(), '/webhooks');
        assert.equal(find('tr:contains(' + webhookName + ') td:eq(0)').text(), webhookName, 'Row for ' + webhookName + ' contains correct name');
        assert.equal(find('tr:contains(' + webhookName + ') td:eq(1)').text(), 'Project', 'Row for ' + webhookName + ' contains correct name');
        assert.equal(find('tr:contains(' + webhookName + ') td:eq(2)').text(), '.*', 'Row for ' + webhookName + ' contains correct name');
        assert.equal(find('tr:contains(' + webhookName + ') td:eq(3)').text(), 'testScript.py', 'Row for ' + webhookName + ' contains correct name');
        click('#logout');
    });


});

test('edit/view webhook',function(assert) {
    var expectedData = {
        Name: 'Test Webhook',
        'Hook Id': '99be9bd2-0cf4-40b5-91d8-e8727457fa6a',
        'Event Filter': '.*',
        Script: './tests/scripts/test.sh'
    };

    visit('/webhooks');

    login(assert);

    andThen(function() {
        click('tr:contains(Test Webhook) a.button:contains(Edit/View)');
    });

    andThen(function() {
        for(var field in expectedData) {
            var fieldRow = find('.row:contains(' + field + ')');
            assert.equal(fieldRow.length, 1, 'Page contains row for field: ' + field);
            var fieldInput = find('input',fieldRow);
            assert.equal(fieldInput.length, 1, 'Page contains input for field: ' + field);
            assert.equal(fieldInput.val(), expectedData[field], field + ' has correct value');
        }

        assert.equal(find('#enabledCheck').length, 1, 'Enabled checkbox exists');
        assert.ok(find('#enabledCheck').val(), 'Enabled checkbox is checked');

        assert.equal(find('.row:contains(Channel) select').length, 1, 'Channel field exists');
        assert.equal(find('.row:contains(Channel) select').val(), 'Project', 'Channel field value is Project');
        click('#logout');
    });

});

test('test event filter', function(assert) {
    visit('/webhook/kwTSK9dsQnOS1MVn');

    login(assert);

    andThen(function() {
        click('.row:contains(Event Filter) a.button:contains(Test)');
    });

    var testEventNameRow;

    andThen(function() {
        testEventNameRow = find('.row:contains(Test Event Name)');
        var testEventName = find('input', testEventNameRow);

        assert.equal(testEventNameRow.length, 1, 'Page contains Test Event Name row');
        assert.equal(find('span:contains(Matches)',testEventNameRow).length, 1, 'Matches text is displayed');
        fillIn('.row:contains(Test Event Name) input', 'Test String Match');
    });

    andThen(function() {
        assert.equal(find('span:contains(Matches)',testEventNameRow).length, 1, 'Matches text is displayed');
        fillIn('.row:contains(Event Filter) input','.*TEST_REGEXP.*');
    });

    andThen(function() {
        assert.equal(find('span:contains(No Match)',testEventNameRow).length, 1, 'No Match test is displayed');
        fillIn('.row:contains(Test Event Name) input','Blah Blah Blah--TEST_REGEXP--Random stuff here');
    });

    andThen(function() {
        assert.equal(find('span:contains(Matches)',testEventNameRow).length, 1, 'Matches text is displayed');
        click('.row:contains(Event Filter) a.button:contains(Test)');
    });

    andThen(function() {
        assert.equal(find('span:contains(Test Event Name)').length, 0, 'Test Event Name is not displayed');
        assert.equal(find('a.button:contains(Save):not(disabled)').length, 1, 'Save button is not disabled');
        assert.equal(find('a.button:contains(Cancel):not(disabled)').length, 1, 'Cancel button is not disabled');
        click('a.button:contains(Cancel)');
    });

    andThen(function() {
        assert.equal(currentURL(), '/webhooks', 'Navigated back to main webhooks page after cancel');
        assert.equal(find('tr:contains(Test Webhook) td:eq(2)').text(), '.*', 'Event Filter value is back to original after cancel');
        click('#logout');
    });

});

test('test script', function(assert) {
    var scriptInputNoServerInfo = {
        "name": "Test Webhook",
        "eventFilter": ".*",
        "hookId": "99be9bd2-0cf4-40b5-91d8-e8727457fa6a",
        "channel": "Project",
        "eventName": "Test:EVENT:TEST",
        "payload": {
            "this": "is",
            "some": {
                "valid": "JSON"
            }
        }
    };

    var scriptInputWithServerInfo = {
        "name": "Test Webhook",
        "eventFilter": ".*",
        "hookId": "99be9bd2-0cf4-40b5-91d8-e8727457fa6a",
        "channel": "Project",
        "eventName": "Test:EVENT:TEST",
        "payload": {
            "this": "is",
            "some": {
                "valid": "JSON"
            }
        },
        "apiToken": "TEST API TOKEN",
        "minServer": "http://localhost:8081"
    };

    visit('/webhook/kwTSK9dsQnOS1MVn');

    login(assert);

    andThen(function() {
        click('.row:contains(Script) a.button:contains(Test)');
    });

    andThen(function() {
        assert.equal(find('.row:contains(Test Event Name)').length, 1, 'Page contains Test Event Name row');
        fillIn('.row:contains(Test Event Name) input','Test:EVENT:TEST');
        fillIn('.row:contains(Test Payload) textarea','This is not JSON');
    });

    andThen(function() {
        assert.equal(find('span.error:contains(Invalid JSON)').length, 1, 'Invalid JSON message is shown');
        fillIn('.row:contains(Test Payload) textarea',JSON.stringify({this: 'is', some: { valid: 'JSON' }}));
    });

    andThen(function() {
        assert.equal(find('span.error:contains(Invalid JSON)').length, 0, 'Invalid JSON message is not shown');
        assert.equal(find('.row:contains(Send Server Info)').length, 1, 'Send Server Info row is shown');
        assert.equal(find('.row:contains(API Token)').length, 0, 'API Token field is not shown');
        assert.equal(find('.row:contains(SPIDAMin Server)').length, 0, 'SPIDAMin Server field is not shown');
    });
    
    andThen(function() {
        console.log(find('.row:contains(Script Input) textarea').val());
        assert.deepEqual(JSON.parse(find('.row:contains(Script Input) textarea').val()), scriptInputNoServerInfo, 'Script Input is correct');
        click('.row:contains(Send Server Info) input');
    });

    andThen(function() {
        assert.equal(find('.row:contains(API Token)').length, 1, 'API Token field is shown');
        assert.equal(find('.row:contains(SPIDAMin Server)').length, 1, 'SPIDAMin Server field is shown');
        fillIn('.row:contains(API Token) input','TEST API TOKEN');
        fillIn('.row:contains(SPIDAMin Server) input','http://localhost:8081');
    });

    andThen(function() {
        console.log(find('.row:contains(Script Input) textarea').val());
        assert.deepEqual(JSON.parse(find('.row:contains(Script Input) textarea').val()), scriptInputWithServerInfo, 'Script Input is correct');
        click('a.button:contains(Execute Script)');
    });

    andThen(function() {
        assert.equal(find('.error').length, 0, 'No error messages shown');
        assert.equal(find('.row:contains(Script Exit Code) input').val(), '0', 'Script Exit Code is 0');
    });

    andThen(function() {
        console.log(find('.row:contains(Script Output) textarea').val());
        //The below is commented until we can find a way to wait until the below external script has actually run.
        //assert.deepEqual(JSON.parse(find('.row:contains(Script Output) textarea').val()),  {testSTDIN: scriptInputWithServerInfo }, 'Script Output is correct');
        click('#logout');
    });

});

test('webhook logs', function(assert) {
    visit('/webhook/kwTSK9dsQnOS1MVn');

    login(assert);

    andThen(function() {
        assert.equal(find('a.button:contains(Show Logs)').length, 1, 'Show logs button exists');
        click('a.button:contains(Show Logs)');
    });

    andThen(function() {
        assert.equal(find('a.button:contains(Hide Logs)').length, 1, 'Hide logs button exists');
        assert.equal(find('.row:contains(Test Log Entry) div:contains(7/24/2015)').length, 1, 'Date field is shown');
        assert.equal(find('.row:contains(Test Log Entry) a.button:contains(Show Details)').length, 1, 'Show Details button is shown');
        click('.row:contains(Test Log Entry) a.button:contains(Show Details)');
    });

    andThen(function() {
        assert.equal(find('.row:contains(Test Log Entry) a.button:contains(Hide Details)').length, 1, 'Hide Details button is shown');
        assert.equal(find('.row:contains(this) span.postfix:contains(is)').length,1, "this: 'is' log entry detail shown");
        assert.deepEqual(JSON.parse(find('.row:has(span.prefix:contains(a)) textarea').val()), { test: 'logEntry' }, 'Complex JSON log entry value is shown');
        click('a.button:contains(Hide Details)');
    });

    andThen(function() {
        assert.equal(find('.row:contains(this) span.postfix:contains(is)').length,0, "this: 'is' log entry detail not shown");
        click('a.button:contains(Hide Logs)');
    });

    andThen(function() {
        assert.equal(find('.row:contains(Test Log Entry)').length, 0, 'Test log entry is not shown');
        click('#logout'); 
    });

});


