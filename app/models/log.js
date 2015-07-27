import DS from 'ember-data';

export default DS.Model.extend({
    logEntries: DS.hasMany('logEntry',{async: true})
});
