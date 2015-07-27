import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['fileUpload'],

    mimeType: function() {
        return 'application/json';
    }.property('type'),

    actions: {
        fileSelected: function() {
            var fileInput = this.$("input[type=file]")[0];
            var file = fileInput.files[0];

            this.sendAction('action', file);
        }
    }
});
