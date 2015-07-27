import Ember from 'ember';

export default Ember.Route.extend({
    model: function() {
        return {
            webhooks: this.store.find('webhook')
        };
    }
});
