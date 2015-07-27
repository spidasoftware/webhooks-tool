import DS from 'ember-data';

export default DS.Model.extend({
    timestamp: DS.attr('number'),
    message: DS.attr('string'),
    entryData: DS.attr()
});
