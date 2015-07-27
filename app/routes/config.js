import Ember from 'ember';

export default Ember.Route.extend({
    model: function() {
        return new Ember.RSVP.Promise(function(resolve, reject) {
            Ember.$.getJSON('/api/config').then(resolve,function(e) {
                if (e.status === 403) {
                    //We are not logged in yet so don't actually fail. Otherwise the login won't show
                    resolve({});
                } else {
                    reject(e);
                }
            });
        });
    }
});
