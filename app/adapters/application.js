import DS from 'ember-data';

export default DS.RESTAdapter.extend({
    namespace: '/api',
    coalesceFindRequests: true,
    findMany: function(store, type, ids) {
        return this.ajax(this.buildURL(type.modelName), 'GET', { data: { ids: JSON.stringify(ids) } });
    },

    //Handle validation errors
    ajaxError: function(xhr) {
        var error = this._super(xhr);

        if (xhr && xhr.status === 403) {
            return DS.InvalidError('You are not authorized yet');
        } else {
            return error;
        }
    }
});
