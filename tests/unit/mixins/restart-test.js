import Ember from 'ember';
import RestartMixin from '../../../mixins/restart';
import { module, test } from 'qunit';

module('Unit | Mixin | restart');

// Replace this with your real tests.
test('it works', function(assert) {
  var RestartObject = Ember.Object.extend(RestartMixin);
  var subject = RestartObject.create();
  assert.ok(subject);
});
