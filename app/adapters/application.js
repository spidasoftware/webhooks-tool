import DS from 'ember-data';

export default DS.RESTAdapter.extend({
    namespace: '/api',
    coalesceFindRequests: true,
    findMany: function(store, type, ids) {
        return this.ajax(this.buildURL(type.modelName), 'GET', { data: { ids: JSON.stringify(ids) } });
    }
});
