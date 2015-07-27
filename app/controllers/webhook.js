import Ember from 'ember';

export default Ember.Controller.extend({
    actions: {
        save: function() {
            this.transitionToRoute('webhooks');
        }
    }
});
