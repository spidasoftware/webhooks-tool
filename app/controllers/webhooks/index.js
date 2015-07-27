import Ember from 'ember';

export default Ember.Controller.extend({
    actions: {
        new: function() {
            this.transitionToRoute('webhooks.new');
        },
        edit: function(webhook) {
            this.transitionToRoute('webhook', webhook);
        },
        delete: function(webhook) {
            webhook.destroyRecord();
        }
    }
});
