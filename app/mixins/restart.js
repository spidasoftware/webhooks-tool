import Ember from 'ember';

//Wrap jQueries promise in a RVSP Promise since jQuery promises
//are dumb
var getJSON = function(url) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
        Ember.$.getJSON(url).then(resolve, reject);
    });
};

//This will return a promise that will resolve once the server has restarted
var resolveOnceRestart = function(instanceId, waitTime) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
        if (waitTime > 60000) {
            //If the wait time gets up to 60 secs, something went wrong with
            //the restart so just give up
            reject('Restart failed');
        } else {
            setTimeout(function() {
                resolve(getJSON('/api/method/instanceId').then(function(data) {
                    var newInstanceId = data.instanceId;
                    if (newInstanceId === instanceId) {
                        return resolveOnceRestart(instanceId, waitTime * 2);
                    } else {
                        return newInstanceId;
                    }
                }, function() {
                    return resolveOnceRestart(instanceId, waitTime * 2);
                }));
            }, waitTime);
        }
    });
};

export default Ember.Mixin.create({
    restart: function() {
        return getJSON('/api/method/restart').then(function(response) {
            var instanceId = response.instanceId;
            return resolveOnceRestart(instanceId, 100);
        });
    }
});
