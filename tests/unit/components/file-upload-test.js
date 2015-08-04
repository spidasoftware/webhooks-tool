import { moduleForComponent, test } from 'ember-qunit';
import dataDriven from '../../helpers/data-driven';
import Ember from 'ember';

moduleForComponent('file-upload', 'Unit | Component | file upload', {
  // Specify the other units that are required for this test
  // needs: ['component:foo', 'helper:bar'],
  unit: true
});

test('it renders', function(assert) {
  assert.expect(2);

  // Creates the component instance
  var component = this.subject();
  assert.equal(component._state, 'preRender');

  // Renders the component to the page
  this.render();
  assert.equal(component._state, 'inDOM');
});

