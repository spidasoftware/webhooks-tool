import Ember from 'ember';
import { module, test } from 'qunit';
import startApp from 'webhooks-tool/tests/helpers/start-app';
/* global login */

var application;

module('Acceptance | login', {
  beforeEach: function() {
    application = startApp();
  },

  afterEach: function() {
    Ember.run(application, 'destroy');
  }
});

test('Nav bar links', function(assert) {
    visit('/');

    andThen(function() {
        assert.equal(currentURL(), '');
    });

    andThen(function() {
        login(assert);
    });

    andThen(function() {
        click('#usersLink a');
    });

    andThen(function() {
        assert.equal(currentPath(),'users');
        click('#webhooksLink a');
    });

    andThen(function() {
        assert.equal(currentPath(),'webhooks.index');
        click('#configLink a');
    });

    andThen(function() {
        assert.equal(currentPath(),'config');
        click('#adminLink a');
    });

    andThen(function() {
        assert.equal(currentPath(),'admin');
        click('#logout');
    });

    andThen(function() {
        assert.equal(find('#logout').length, 0, 'User is logged out');
    });

});
