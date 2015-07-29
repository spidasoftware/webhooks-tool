import Ember from 'ember';

export default Ember.Controller.extend({
    notNewWebhooks: Ember.computed.filterBy('model.webhooks','isNew',false),
    sortedWebhooks: Ember.computed.sort('notNewWebhooks',function(a,b) {
        return a.get('name').localeCompare(b.get('name'));
    }),

    actions: {
        new: function() {
            this.transitionToRoute('webhooks.new');
        },
        edit: function(webhook) {
            this.transitionToRoute('webhook', webhook);
        },
        delete: function(webhook) {
            webhook.destroyRecord();
        },
        save: function(webhook) {
            this.send('startWorking','Saving webhook...');
            var self=this;
            webhook.save().then(function() {
                self.send('stopWorking');
            });
        }

    }
});
