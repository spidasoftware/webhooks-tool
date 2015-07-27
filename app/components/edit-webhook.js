import Ember from 'ember';
import DS from 'ember-data';
import ArrayPager from 'webhook-server/mixins/array-pager';

export default Ember.Component.extend(ArrayPager,{
    channels: ['Project','Status','Form','File','Tag','Action'],
    showingLogs: false,

    isTestingScript: false,
    scriptRunning: false,
    scriptExitCode: 0,
    scriptPayload: '{}',
    scriptOutput: '',
    scriptError: false,
    parsedPayload: {},

    isTestingFilter: false,
    filterMatches: function() {
        var testRegExp = this.get('testRegExp');
        var testEventName = this.get('testEventName');

        return testRegExp.test(testEventName);
    }.property('testEventName','testRegExp'),
    testRegExp: function() {
        var eventFilter = this.get('webhook.eventFilter');

        return new RegExp('^' + eventFilter + '$');
    }.property('webhook.eventFilter'),

    payloadInvalid: function() {
        var parsedPayload={};
        var payloadInvalid = true;

        try {
            parsedPayload = JSON.parse(this.get('scriptPayload'));
            payloadInvalid = false;
        } catch(e) {}
            
        this.set('parsedPayload',parsedPayload);
        return payloadInvalid;
    }.property('scriptPayload'),

    scriptInput: function() {
        return JSON.stringify({
            name: this.get('webhook.name'),
            eventFilter: this.get('webhook.eventFilter'),
            hookId: this.get('webhook.hookId'),
            channel: this.get('webhook.channel'),
            eventName: this.get('testEventName'),
            payload: this.get('parsedPayload')
        });
    }.property('parsedPayload','testEventName','webhook.hookId','webhook.channel','webhook.name','webhook.eventFilter'),

    //This is the logEntries in webhook.log.logEntries in reverse order
    contentToPage: function() {
        return DS.PromiseArray.create({
            promise: this.get('webhook.log.logEntries').then(function(logEntries) {
                return logEntries.toArray().reverse();
            })
        });
    }.property('webhook.log.logEntries'),

    actions: {
        testFilter: function() {
            this.toggleProperty('isTestingFilter');
        },
        toggleTestScript: function() {
            this.toggleProperty('isTestingScript');
        },
        testScript: function() {
            this.set('scriptError', false);
            this.set('scriptRunning', true);
            this.set('scriptExitCode','');
            this.set('scriptOutput','');

            var self=this;
            Ember.$.ajax('/api/method/testScript', {
                contentType: 'application/json',
                processData: false,
                data: JSON.stringify({
                    stdin: this.get('scriptInput'),
                    script: this.get('webhook.script'),
                    name: this.get('webhook.name'),
                    eventName: this.get('testEventName')
                }),
                dataType: 'json',
                method: 'POST'
            }).then(function(body) {
                self.set('scriptRunning',false);
                if (body.scriptRan) {
                    self.set('scriptExitCode',body.exitCode);
                    self.set('scriptOutput', body.output);
                } else {
                    self.set('scriptError', true);
                    self.set('scriptErrorMessage',body.message || 'An error occured trying to execute the script');
                }
            });
        },

        save: function() {
            var webhook = this.get('webhook');
            var self = this;

            if (webhook.get('isNew')) {
                this.sendAction('startWorking','Saving webhook...');
                webhook.get('log').then(function(log) {
                    return Ember.RSVP.all(log.get('logEntries').map(function(logEntry) {
                        return logEntry.save();
                    })).then(function() {
                        return log.save();
                    });
                }).then(function() {
                    return webhook.save();
                }).then(function() {
                    self.sendAction('save');
                    self.sendAction('stopWorking');
                });
            } else {
                this.sendAction('startWorking','Saving webhook...');
                webhook.save().then(function() {
                    self.sendAction('save');
                    self.sendAction('stopWorking');
                });
            }
        },
        toggleLogs: function() {
            this.toggleProperty('showingLogs');
        }
    }
});
