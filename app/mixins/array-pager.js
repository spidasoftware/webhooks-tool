import Ember from 'ember';

//Ember > 0.9 seems to be having issues with the ember-cli-pagination plugin.
//It doesn't handle it well when the content of an ArrayProxy used for
//pagination changes. So, this mixin was created to work around that.  It does
//pagination without relying on an ArrayProxy.
export default Ember.Mixin.create({

    totalPages: function() {
        var contentLength = this.get('contentToPage.length');
        var pageLength = this.get('pageLength');
        if (contentLength === 0) {
            return 1;
        } else {
            return Math.ceil(contentLength/pageLength);
        }
    }.property('contentToPage.length','pageLength'),

    pagedContent: function() {
        var page=this.get('page');
        var pageLength = this.get('pageLength');
        var content = this.get('contentToPage');
        var start = pageLength * (page-1);
        var end = pageLength * page;

        if (content && content.get('length')>0) {
            return content.slice(start,end);
        } else {
            return [];
        }
    }.property('page','pageLength','contentToPage.@each'),

    onTotalPages: function() {
        var totalPages = this.get('totalPages');
        if (this.get('page') > totalPages) {
            this.set('page',totalPages);
        }
    }.observes('totalPages'),

    page: 1,
    pageLength: 10
});
