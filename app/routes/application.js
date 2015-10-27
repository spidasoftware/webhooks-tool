import Ember from 'ember';
import config from 'webhooks-tool/config/environment';

export default Ember.Route.extend({
    model: function() {
        return Ember.$.getJSON(config.baseURL + 'isLoggedIn');
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
