import Ember from 'ember';

export default Ember.Route.extend({
    model: function() {
        return {
            users: this.store.find('user')
        };
    }
});
