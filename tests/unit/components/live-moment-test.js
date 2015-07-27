import { moduleForComponent, test } from 'ember-qunit';
import dataDriven from '../../helpers/data-driven';
/*global moment:true*/

moduleForComponent('live-moment', 'Unit | Component | live moment', {
  // Specify the other units that are required for this test
  // needs: ['component:foo', 'helper:bar'],
  unit: true
});

var mockMoment = function(assert, expectedValue, expectedFormat) {
    return function(value) {
        assert.equal(value, expectedValue, 'value is correct');
        var ret = {};
        ['fromNow', 'calendar', 'format'].forEach(function(method) {
            ret[method] = function() {
                assert.equal(method, expectedFormat, 'Expected format requested from moment');
                return 'TEST';
            };
        });

        return ret;
    };
};

test('it renders', function(assert) {
  assert.expect(2);

  // Creates the component instance
  var component = this.subject();
  assert.equal(component._state, 'preRender');

  // Renders the component to the page
  this.render();
  assert.equal(component._state, 'inDOM');
});

dataDriven(test, 'format test', [
        {name: 'fromNow', expectedFormat: 'fromNow'},
        {name: 'calendar', expectedFormat: 'calendar'},
        {name: 'default', expectedFormat: 'format'}
    ], function(data) {
        return function(assert) {
            assert.expect(3);

            var value = 12;
            moment = mockMoment(assert, 12, data.expectedFormat);
            var component = this.subject({value: 12, format: data.name});
            assert.equal('TEST', component.get('momentValue'));
        };
    }
);
