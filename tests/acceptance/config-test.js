import Ember from 'ember';
import { module, test } from 'qunit';
import startApp from 'webhooks-tool/tests/helpers/start-app';
/* global login */

var application;

module('Acceptance | config', {
  beforeEach: function() {
    application = startApp();
  },

  afterEach: function() {
    Ember.run(application, 'destroy');
  }
});

test('visiting /config', function(assert) {
    visit('/');

    andThen(function() {
        login(assert);
    });

    visit('/config');

    var expectedValues = {
        'HTTP Port': '8080',
        'HTTPS Port': '',
        'HTTPS Certificate File': '',
        'HTTPS Key File': '',
        'Server External URL': 'http://localhost:8080/',
        'SPIDAMin API Token': 'API_TOKEN',
        'SPIDAMin Base URL': 'http://localhost:8081/',
        'SPIDAMIn Product': 'projectmanager',
        'Lease Time (seconds)': 1200,
        'Lease Lead Time (seconds)': 200,
        'Log Executed Script Output': "on",
        'Log Executed Script Input': "on",
        'Pass Server Info to Script': "on"
    };

    andThen(function() {
        for (var label in expectedValues) {
            var row = find('.row:contains(' + label + ')');
            assert.equal(row.length,1, 'A row with label ' + label + ' exists');
            assert.equal(find('input', row).val(), expectedValues[label], 'Property ' + label + ' is ' + expectedValues[label]);
        }

        assert.equal(currentURL(), '/config');
    });
});
