import { moduleForModel, test } from 'ember-qunit';

moduleForModel('webhook', 'Unit | Model | webhook', {
  // Specify the other units that are required for this test.
  needs: ['model:log', 'model:logEntry']
});

test('it exists', function(assert) {
  var model = this.subject();
  // var store = this.store();
  assert.ok(!!model);
});
