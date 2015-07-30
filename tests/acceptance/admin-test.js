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

  andThen(function() {
    assert.equal(currentURL(), '/admin');
  });
});
