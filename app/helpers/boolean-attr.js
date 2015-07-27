import Ember from 'ember';

export function booleanAttr(params/*, hash*/) {
    if (params[0]) {
        return params[1] ? params[1] : 'disabled';
    } else {
        return null;
    }
}

export default Ember.HTMLBars.makeBoundHelper(booleanAttr);
