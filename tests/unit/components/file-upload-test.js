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

test('formatting', function(assert) {
    assert.expect(4);

    // Creates the component instance
    var component = this.subject({
        value: 1438005728165
    });
    assert.equal(component._state, 'preRender');

    // Renders the component to the page
    this.render();
    assert.equal(component._state, 'inDOM');

    Ember.run(function() {
      assert.equal(component.get('momentValue'), '', 'Default Date format renders correctly');
      component.set('format', 'calendar');
    });

    Ember.run(function() {
        assert.equal(component.get('momentValue'), '', 'Calendar Date format renders correctly');
    });
});

