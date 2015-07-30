import Ember from 'ember';
import { module, test } from 'qunit';
import startApp from 'webhooks-tool/tests/helpers/start-app';
/*global login*/

var application;

module('Acceptance | users', {
  beforeEach: function() {
    application = startApp();
  },

  afterEach: function() {
    Ember.run(application, 'destroy');
  }
});

test('verify content on /users', function(assert) {
    visit('/users');

    login(assert);

    andThen(function() {
        assert.equal(find('#newUser').length,1,'New user button is shown');

        var adminRow = find('.row:contains(admin)');
        assert.equal(adminRow.length, 1, "A row for the admin user exists");

        var resetButton = find('a:contains(Reset Password)', adminRow);
        assert.equal(resetButton.length, 1, "A reset button for the admin user exists");

        var deleteButton = find('a:contains(Delete)', adminRow);
        assert.equal(deleteButton.length, 1, "A delete button for the admin user exists");
    });

    andThen(function() {
        assert.equal(currentURL(), '/users');
    });
});

test('Create new user', function(assert) {
    visit('/users');

    var username = 'testUser' + Math.floor(Math.random() * 10000);
    var password = 'abcd' + Math.floor(1000 + Math.random() * 10000);

    login(assert);

    andThen(function() {
        click('#newUser');
    });

    andThen(function() {
        assert.equal(find('input[type=text]').length,1,'New user username field is shown');
        assert.equal(find('input[type=password]').length,1,'New user password field is shown');
        assert.equal(find('a:contains(Save)').length, 1, 'New user save button is shown');

        fillIn('input[type=text]', username);
        fillIn('input[type=password]', '1234567');
    });

    andThen(function() {
        assert.equal(find('span.error:contains(Please enter a password greater than 8 characters long.)', newUserRow).length, 1, 'Error message shown when password is too short');
        fillIn('input[type=password]', password);
    });


    andThen(function() {
        click('a:contains(Save)');
    });

    andThen(function() {
        var newUserRow = find('.row:contains(' + username + ')');
        assert.equal(newUserRow.length, 1, 'New user is created');
        assert.equal(find('a:contains(Reset Password)',newUserRow).length, 1, 'Reset password button for new user exists');
        assert.equal(find('a:contains(Delete)',newUserRow).length, 1, 'Delete button for new user exists');
        click('#logout');
    });

    var newUserRow;
    andThen(function() {
        //Login as new user
        login(assert, username, password);
    });

    andThen(function() {
        newUserRow = find('.row:contains(' + username + ')');

        assert.equal(newUserRow.length, 1, 'Row for new user exists');

        click('a:contains(Reset Password)',newUserRow);
    });

    var resetPassword;
    andThen(function() {
        resetPassword = find('input[type="password"]',newUserRow);

        assert.equal(resetPassword.length, 1, 'Reset Password field is show for user when reset is clicked');
        fillIn(resetPassword, '1234567');
    });

    var newPassword = 'efgh' + Math.floor(1000 + Math.random() * 10000);

    andThen(function() {
        assert.equal(find('span.error:contains(Please enter a password greater than 8 characters long.)', newUserRow).length, 1, 'Error message shown when password is too short');
        fillIn(resetPassword, newPassword);
    });

    andThen(function() {
        click('a:contains(Reset)');
    });

    andThen(function() {
        click('#logout');
    });

    andThen(function() {
        login(assert, username, password, true);
    });

    andThen(function() {
        login(assert, username, newPassword);
    });

    andThen(function() {
        newUserRow = find('.row:contains(' + username + ')');
        assert.equal(newUserRow.length, 1, 'New user is shown');
        var newUserDeleteButton = find('a:contains(Delete)',newUserRow);
        assert.equal(newUserDeleteButton.length, 1, 'Delete button for new user is shown');
        click(newUserDeleteButton);
    });

    andThen(function() {
        assert.equal(find('.row:contains(' + username + ')').length, 0, 'New user row is gone');
        click('#logout');
    });

});
