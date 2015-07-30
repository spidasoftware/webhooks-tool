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

    andThen(function() {
        assert.equal(currentURL(), '/config');
    });
});
