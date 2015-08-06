import Ember from 'ember';

export default Ember.Controller.extend({
    sortedUsers: Ember.computed.sort('model.users',function(a,b) {
        return a.get('name').localeCompare(b.get('name'));
    }),

    actions: {
        new: function() {
            this.store.createRecord('user', {name: ''});
        }
    }
});
