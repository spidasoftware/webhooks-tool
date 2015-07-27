import DS from 'ember-data';

export default DS.Model.extend({
    name: DS.attr('string'),
    hookId: DS.attr('string'),
    comment: DS.attr('string'),
    leaseEnd: DS.attr('number'),
    script: DS.attr('string'),
    eventFilter: DS.attr('string'),
    channel: DS.attr('string'),
    enabled: DS.attr('boolean'),
    log: DS.belongsTo('log', {async: true})
});
