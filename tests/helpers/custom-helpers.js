import Ember from 'ember';

var DEFAULT_USERNAME = 'admin';
var DEFAULT_PASSWORD = '1234';

var customHelpers = (function() {
    Ember.Test.registerAsyncHelper('login', function(app, assert, username, password, expectFail) {
        if (find('#logout').length === 1) {
            click('#logout');
        }

        username = username || DEFAULT_USERNAME;
        password = password || DEFAULT_PASSWORD;


        andThen(function() {
            assert.equal(find('#username').length, 1, 'Username field exists');
            assert.equal(find('#password').length, 1, 'Password field exists');
            assert.equal(find('#login').length, 1, 'Login button exists');
            fillIn('#username',username);
            fillIn('#password',password);
        });

        andThen(function() {
            click('#login');
        });

        andThen(function() {
            if (expectFail) {
                assert.equal(find('#passwordInvalid').length, 1, 'Invalid password message is shown');
            } else {
                assert.equal(find('#logout').length, 1, 'Logout button is shown');
            }  
        });

    });
})();

export default customHelpers;
