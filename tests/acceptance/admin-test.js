import Ember from 'ember';
import { module, test } from 'qunit';
import startApp from 'webhooks-tool/tests/helpers/start-app';
/*global login*/

var application;

module('Acceptance | admin', {
  beforeEach: function() {
    application = startApp();
  },

  afterEach: function() {
    Ember.run(application, 'destroy');
  }
});

test('visiting /admin', function(assert) {
  visit('/admin');

  login(assert);

  var importExportButtons = ['Config','Users','Webhooks','Everything'];
  var bottomButtons = ['Resync', 'Restart', 'Download Logs'];

  andThen(function() {
    assert.equal(currentURL(), '/admin');
    var button;
    for (var i=0; i<importExportButtons.length; i++) {
        button = importExportButtons[i];
        assert.equal(find('a.button:contains(' + button + ')').length, 2, 'Import/Export buttons for ' + button + ' appear');
    }

    for (i=0; i<bottomButtons.length; i++) {
        button = bottomButtons[i];
        assert.equal(find('a.button:contains(' + button + ')').length, 1, 'Button ' + button + ' is shown');
    }

    click('#logout');

  });
});
