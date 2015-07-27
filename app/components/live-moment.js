import Ember from 'ember';
/*global moment*/

export default Ember.Component.extend({
    tagName: 'span',
    disabled: true,

    typePlain: function() {
        return this.get('type') === 'plain';
    }.property('type'),

    momentObject: function() {
        return moment(this.get('value'));
    }.property('value'),

    momentValue: function() {
        var m = this.get('momentObject');
        var format = this.get('format');

        if (format === 'fromNow') {
            return m.fromNow();
        } else if (format === 'calendar') {
            return m.calendar();
        } else {
            return m.format();
        }
    }.property('momentObject', 'format'),

    didInsertElement: function() {
        var self=this;
        if (this.get('live')) {
            this.set('liveInterval', setInterval(function() {
                self.notifyPropertyChange('momentObject');
            }, 15000));
        }
    },

    willDestroyElement: function() {
        var liveInterval = this.get('liveInterval');
        if (liveInterval) {
            clearInterval(liveInterval);
        }
    }
});
