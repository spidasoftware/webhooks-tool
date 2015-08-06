import Ember from 'ember';

export default Ember.Component.extend({
    detailArray: function() {
        var entryData = this.get('logEntry.entryData');

        var result = [];
        for (var key in entryData) {
            var value = entryData[key];
            result.push(Ember.Object.create({
                key: key,
                value: (typeof value === 'object') ? JSON.stringify(value) : value,
                isLarge: (typeof value === 'object' || value.length > 80)
            }));
        }

        //Sort details so "large" ones are at the bottom
        return result.sort(function(a,b) {
            return (a.isLarge ? 1 : 0) - (b.isLarge ? 1 : 0);
        });
    }.property('logEntry.entryData'),

    actions: {
        toggleDetails: function() {
            this.toggleProperty('showingDetails');
        }
    }
});
