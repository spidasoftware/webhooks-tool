import Ember from 'ember';

/* Creates a pagination navigation section using ember classes needs to be
 * given a pagedContent property which should reference a pagedContent object
 * from ember-pagination See templates/detail/logs.hbs for an example
*/

export default Ember.Component.extend({
    classNames: ['pagination-centered'],

    isFirst: function() {
        return this.get('currentPage')===1;
    }.property('currentPage'),

    isLast: function() {
        return this.get('currentPage')===this.get('totalPageCount');
    }.property('currentPage','totalPageCount'),

    //This is to allow this component to be created passing in either a pageContext object
    //or a currentPage and totalPages value
    currentPage: Ember.computed.alias('pageContext.page'),
    totalPageCount: Ember.computed.alias('pageContext.totalPages'),
    pageContext: function() {
        if (this.get('pagedContent')) {
            return this.get('pagedContent');
        } else {
            return this;
        }
    }.property(),


    pages: function() {
        var i;
        var currentPage=this.get('currentPage');
        var totalPages=this.get('totalPageCount');
        var pagesAround = [];

        for(i=1;i<=totalPages;i++) {
            pagesAround.push({page: i, current: i===currentPage, gap: false});
            if (i<currentPage-2) {
                pagesAround.push({gap: true});
                i=currentPage-2;
            } else if (i>currentPage && i<totalPages-1) {
                pagesAround.push({gap: true});
                i=totalPages-1;
            }
        }
        return pagesAround;
    }.property('currentPage','totalPageCount'),

    actions: {
        gotoPage: function(page) {
            this.set('currentPage',page);
        },
        prevPage: function() {
            this.decrementProperty('currentPage');
        },
        nextPage: function() {
            this.incrementProperty('currentPage');
        },
        firstPage: function() {
            this.set('currentPage',1);
        },
        lastPage: function() {
            this.set('currentPage',this.get('totalPageCount'));
        }
    }

});
