import Ember from 'ember';

var pad2 = function(n) {
    if (n<10) {
        return '0' + n;
    } else {
        return String(n);
    }
};

export default Ember.Route.extend({
    model: function() {
        var now = new Date();
        return this.store.createRecord('webhook', {
            name: 'New Webhook ' + now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate()),
            product: 'projectmanager',
            channel: 'Project',
            eventFilter: '.*',
            enabled: true,
            log: this.store.createRecord('log', {
                logEntries: [ this.store.createRecord('logEntry', {
                    timestamp: Date.now(),
                    message: 'Webhook created',
                    entryData: {}
                })]
            })
        });
    }
});
