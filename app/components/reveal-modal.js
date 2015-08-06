import Ember from 'ember';

/* An ember component that wraps foundations "reveal-modal" and handles
* ember/foundation incompatabilities */

export default Ember.Component.extend({
    visible: false,
    classNames: ['reveal-modal'],

    didInsertElement: function() {
        var self=this;
        this.$().attr('data-reveal',true);
        //This is to catch the modal closing itself
        this.$().on('close',function() {
            self.set('visible',false);
        });

    },

    onVisible: function() {
        var visible = this.get('visible');

        this.$().foundation('reveal',visible?'open':'close');
    }.observes('visible')
});
