import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'a',
    classNames: ['button'],
    classNameBindings: ['size', 'disabledValue:disabled', 'postfix', 'right', 'left', 'active', 'bottom'],
    attributeBindings: ['disabledValue:disabled','href'],

    size: 'tiny',
    disabled: false,
    enabled: true,
    active: false,
    postfix: false,
    right: false,
    left: false,
    bottom: false,

    disabledValue: function() {
        if (this.get('disabled') || !this.get('enabled')) {
            return 'disabled';
        } else {
            return undefined;
        }
    }.property('disabled', 'enabled'),

    click: function() {
        if (!this.get('disabledValue')) {
            this.sendAction('action', this.get('actionParam'));
        }
    }
});
