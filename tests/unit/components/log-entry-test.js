import Ember from 'ember';
import { moduleForComponent, test } from 'ember-qunit';

moduleForComponent('log-entry', 'Unit | Component | log entry', {
  // Specify the other units that are required for this test
  needs: ['component:live-moment'],
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

test('toggle details', function(assert) {
    assert.expect(5);

    // Creates the component instance
    var component = this.subject();
    assert.equal(component._state, 'preRender');

    // Renders the component to the page
    this.render();
    assert.equal(component._state, 'inDOM');

    Ember.run(function() {
        component.send('toggleDetails');
    });
    assert.ok(component.get('showingDetails'));
    Ember.run(function() {
        component.send('toggleDetails');
    });
    assert.ok(!component.get('showingDetails'));
    Ember.run(function() {
        component.send('toggleDetails');
    });
    assert.ok(component.get('showingDetails'));

});

test('detail array', function(assert) {
    assert.expect(9);

    // Creates the component instance
    var component = this.subject({
        logEntry: Ember.Object.create({
            entryData: {
                d: {
                    e: 'f',
                    g: 'hijkl'
                },
                m: 'abcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabc',
                a: 'bc'
            }
        })
    });

    var detailArray = component.get('detailArray');
    assert.equal(detailArray[0].get('key'), 'a');
    assert.equal(detailArray[0].get('value'), 'bc');
    assert.ok(!detailArray[0].get('isLarge'));
    assert.equal(detailArray[1].get('key'), 'd');
    assert.equal(detailArray[1].get('value'), '{"e":"f","g":"hijkl"}');
    assert.ok(detailArray[1].get('isLarge'));
    assert.equal(detailArray[2].get('key'), 'm');
    assert.equal(detailArray[2].get('value'), 'abcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabc');
    assert.ok(detailArray[2].get('isLarge'));

});

