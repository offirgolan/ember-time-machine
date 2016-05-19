import Ember from 'ember';
import TimeMachine from 'ember-time-machine';
import { module, test } from 'qunit';

let tm, state;

module('Unit | Proxy | array', {
  beforeEach() {
    tm =  TimeMachine.Array.create({
      content: Ember.A()
    });

    state = tm.get('_rootMachineState');
  }
});

test('single change detected', function(assert) {
  const records = state.get('records');

  tm.pushObject('Offir');

  assert.equal(records.length, 1);
  assert.equal(state.get('currIndex'), 0);

  let record = records[0];

  assert.equal(record.type, 'ADD');
  assert.equal(record.isArray, true);
  assert.equal(record.before, undefined);
  assert.deepEqual(record.after, ['Offir']);
});
