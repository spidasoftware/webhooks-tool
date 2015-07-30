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
