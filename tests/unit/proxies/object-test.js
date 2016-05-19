import Ember from 'ember';
import TimeMachine from 'ember-time-machine';
import { module, test } from 'qunit';

let tm, state;

module('Unit | Proxy | object', {
  beforeEach() {
    tm =  TimeMachine.Object.create({
      content: Ember.Object.create()
    });

    state = tm.get('_rootMachineState');
  }
});

test('single change detected', function(assert) {
  const records = state.get('records');

  tm.set('firstName', 'Offir');

  assert.equal(records.length, 1);
  assert.equal(state.get('currIndex'), 0);

  let record = records[0];

  assert.equal(record.type, 'ADD');
  assert.equal(record.before, undefined);
  assert.equal(record.after, 'Offir');
});

test('multiple changes detected', function(assert) {
  const records = state.get('records');

  for(let i = 1; i <= 10; i++) {
    tm.set('number', i);
    tm.set('squared', i * i);
  }

  assert.equal(records.length, 20);
  assert.equal(state.get('currIndex'), 19);
});

test('undo single change', function(assert) {
  const records = state.get('records');

  tm.set('firstName', 'Offir');

  assert.equal(tm.get('firstName'), 'Offir');
  assert.equal(records.length, 1);
  assert.equal(state.get('currIndex'), 0);

  tm.undo();

  assert.equal(tm.get('firstName'), undefined);
  assert.equal(records.length, 1);
  assert.equal(state.get('currIndex'), -1);
});

test('undo all changes', function(assert) {
  const records = state.get('records');

  for(let i = 1; i <= 10; i++) {
    tm.set('number', i);
    tm.set('squared', i * i);
  }

  assert.equal(tm.get('number'), 10);
  assert.equal(tm.get('squared'), 100);
  assert.equal(records.length, 20);
  assert.equal(state.get('currIndex'), 19);

  tm.undoAll();

  assert.equal(tm.get('number'), undefined);
  assert.equal(tm.get('squared'), undefined);
  assert.equal(records.length, 20);
  assert.equal(state.get('currIndex'), -1);
});

test('undo and redo single change', function(assert) {
  const records = state.get('records');

  tm.set('firstName', 'Offir');

  assert.equal(tm.get('firstName'), 'Offir');
  assert.equal(records.length, 1);
  assert.equal(state.get('currIndex'), 0);

  tm.undo();

  assert.equal(tm.get('firstName'), undefined);
  assert.equal(records.length, 1);
  assert.equal(state.get('currIndex'), -1);

  tm.redo();

  assert.equal(tm.get('firstName'), 'Offir');
  assert.equal(records.length, 1);
  assert.equal(state.get('currIndex'), 0);
});

test('undo and redo all changes', function(assert) {
  const records = state.get('records');

  for(let i = 1; i <= 10; i++) {
    tm.set('number', i);
    tm.set('squared', i * i);
  }

  assert.equal(tm.get('number'), 10);
  assert.equal(tm.get('squared'), 100);
  assert.equal(records.length, 20);
  assert.equal(state.get('currIndex'), 19);

  tm.undoAll();

  assert.equal(tm.get('number'), undefined);
  assert.equal(tm.get('squared'), undefined);
  assert.equal(records.length, 20);
  assert.equal(state.get('currIndex'), -1);

  tm.redoAll();

  assert.equal(tm.get('number'), 10);
  assert.equal(tm.get('squared'), 100);
  assert.equal(records.length, 20);
  assert.equal(state.get('currIndex'), 19);
});
