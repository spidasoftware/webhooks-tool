import Ember from 'ember';
import config from 'webhooks-tool/config/environment';

export default Ember.Route.extend({
    model: function() {
        return new Ember.RSVP.Promise(function(resolve, reject) {
            Ember.$.getJSON(config.baseURL + 'api/config').then(resolve,function(e) {
                Ember.run(function() {
                    if (e.status === 403) {
                        //We are not logged in yet so don't actually fail. Otherwise the login won't show
                        resolve({});
                    } else {
                        reject(e);
                    }
                });
            });
        });
    }
});
