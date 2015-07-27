import Ember from 'ember';

export default Ember.Route.extend({
    model: function(params) {
        return this.store.findById('webhook', params.id).catch(function() {
            //Just do nothing since we are probably just not logged in yet
        });
    }
});
