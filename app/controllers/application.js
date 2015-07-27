import Ember from 'ember';

var LOGOUT_GRACE = 30 * 60 * 1000;

export default Ember.Controller.extend({
    //Note: the isLoggedIn property is for determining what to show the user,
    //changing it does not actually control whether the user is considered
    //logged in.
    isLoggedIn: Ember.computed.alias('model.login.isLoggedIn'),
    showInvalidPasswordMessage: false,
    showWorking: false,

    showingUsers: function() {
        var currentPath = this.get('currentPath');
        return currentPath === 'users';
    }.property('currentPath'),

    showingWebhooks: function() {
        var currentPath = this.get('currentPath');
        return currentPath === 'webhooks';
    }.property('currentPath'),

    showingConfig: function() {
        var currentPath = this.get('currentPath');
        return currentPath === 'config';
    }.property('currentPath'),

    showingAdmin: function() {
        var currentPath = this.get('currentPath');
        return currentPath === 'admin';
    }.property('currentPath'),

    setLoginTimeout: function() {
        var expires = this.get('model.login.expires');
        var loginTimeout = this.get('loginTimeout');

        if (loginTimeout) {
            clearTimeout(loginTimeout);
        }

        var self=this;
        if (expires) {
            this.set('loginTimeout',setTimeout(function() {
                self.set('willBeLoggedOut', true);
                self.set('logoutGraceTimeout', setTimeout(function() {
                    self.send('logout');
                },LOGOUT_GRACE));
            },expires - (Date.now() + LOGOUT_GRACE)));
        }
    }.observes('model.login.expires').on('init'),

    actions: {
        login: function() {
            var self = this;

            this.set('showInvalidPasswordMessage',false);
            Ember.$.ajax('/login', {
                contentType: 'application/json',
                method: 'post',
                data: JSON.stringify({
                    name: this.get('username'),
                    password: this.get('password'),
                }),
                processData: false,
                dataType: 'json'
            }).then(function(data) {
                //Request went through (but we may not be logged in)
                if (data.success) {
                    self.set('model.login',Ember.Object.create(data.login));
                    //Refresh the route to reload stuff from api (it is not
                    //available if we are not logged in)
                    self.send('refresh');
                    
                    //Clear username and password fields
                    self.set('username','');
                    self.set('password','');
                } else {
                    self.set('isLoggedIn',false);
                    self.set('showInvalidPasswordMessage',true);
                }
            }, function() {
                //Request failed.
                self.set('showInvalidPasswordMessage',true);
            });
        },

        logout: function() {
            Ember.$.get('/logout');
            this.set('willBeLoggedOut', false);
            this.set('isLoggedIn',false);
            this.send('stopWorking');
        },

        renewLogin: function() {
            clearTimeout(this.get('logoutGraceTimeout'));
            this.send('startWorking', 'Renewing login...');

            var self = this;
            Ember.$.ajax('/renewLogin', {dataType: 'json'}).then(function(response) {
                if (response.success) {
                    self.set('model.login',Ember.Object.create(response.login));
                    self.send('stopWorking');
                    self.set('willBeLoggedOut', false);
                } else {
                    self.send('logout');
                    self.send('stopWorking');
                }
            },function() {
                self.send('logout');
                self.send('stopWorking');
            });

        },

        startWorking: function(message) {
            this.set('workingMessage', message);
            this.set('showWorking', true);
        },

        stopWorking: function() {
            this.set('showWorking',false);
        }
    }
});
