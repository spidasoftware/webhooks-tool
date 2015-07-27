import Ember from 'ember';

export default Ember.Route.extend({
    model: function() {
        return Ember.$.getJSON('/isLoggedIn');
    },

    actions: {
        refresh: function() {
            this.refresh();
        },

        startWorking: function(message) {
            this.controllerFor('application').send('startWorking', message);
        },

        stopWorking: function() {
            this.controllerFor('application').send('stopWorking');
        }
    }
});
