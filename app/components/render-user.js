import Ember from 'ember';
import config from 'webhooks-tool/config/environment';

export default Ember.Component.extend({

    hasName: Ember.computed.notEmpty('user.name'),
    passwordEntered: Ember.computed.notEmpty('newPassword'),
    //Password is "valid" if empty so the error message does not show
    //immediately, user can not save or reset until entered and valud
    passwordValid: function() {
        var newPassword = this.get('newPassword');

        return !this.get('passwordEntered') || newPassword.length >= 8;
    }.property('newPassword'),
    canSave: Ember.computed.and('passwordEntered', 'passwordValid', 'hasName'),
    cantSave: Ember.computed.not('canSave'),

    actions: {
        showReset: function() {
            this.set('isReseting',true);
        },

        save: function() {
            var model = this.get('user');
            var self = this;

            this.sendAction('startWorking','Saving user...');
            model.save().then(function() {
                self.send('reset');
                self.sendAction('stopWorking');
            });
        },

        reset: function() {
            var self = this;

            this.sendAction('startWorking','Resetting password...');
            Ember.$.ajax(config.baseURL + 'api/method/resetPassword',{
                contentType: 'application/json',
                method: 'POST',
                data: JSON.stringify({
                    userId: this.get('user.id'),
                    password: this.get('newPassword')
                }),
                processData: false
            }).then(function() {
                Ember.run(function() {
                    self.set('isReseting',false);
                    self.set('newPassword','');
                    self.sendAction('stopWorking');
                });
            },function() {
            });
        },

        delete: function() {
            this.get('user').destroyRecord();
        }
    }
});
