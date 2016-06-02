import Ember from 'ember';
import TimeMachine from 'ember-time-machine';
import { module, test } from 'qunit';

let tm, state, content, ignoredProperties;

module('Unit | Proxy | object', {
  beforeEach() {
    ignoredProperties = Ember.A();
    content = Ember.Object.create();
    tm =  TimeMachine.Object.create({
      content, ignoredProperties
    });

    state = tm.get('_rootMachineState');
  }
});

test('single change detected', function(assert) {
  const records = state.get('records');

  tm.set('firstName', 'Offir');

  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), 0);

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
  assert.equal(state.get('cursor'), 19);
});

test('undo single change', function(assert) {
  const records = state.get('records');

  tm.set('firstName', 'Offir');

  assert.equal(tm.get('firstName'), 'Offir');
  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), 0);

  tm.undo();

  assert.equal(tm.get('firstName'), undefined);
  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), -1);
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
  assert.equal(state.get('cursor'), 19);

  tm.undoAll();

  assert.equal(tm.get('number'), undefined);
  assert.equal(tm.get('squared'), undefined);
  assert.equal(records.length, 20);
  assert.equal(state.get('cursor'), -1);
});

test('undo and redo single change', function(assert) {
  const records = state.get('records');

  tm.set('firstName', 'Offir');

  assert.equal(tm.get('firstName'), 'Offir');
  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), 0);

  tm.undo();

  assert.equal(tm.get('firstName'), undefined);
  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), -1);

  tm.redo();

  assert.equal(tm.get('firstName'), 'Offir');
  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), 0);
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
  assert.equal(state.get('cursor'), 19);

  tm.undoAll();

  assert.equal(tm.get('number'), undefined);
  assert.equal(tm.get('squared'), undefined);
  assert.equal(records.length, 20);
  assert.equal(state.get('cursor'), -1);

  tm.redoAll();

  assert.equal(tm.get('number'), 10);
  assert.equal(tm.get('squared'), 100);
  assert.equal(records.length, 20);
  assert.equal(state.get('cursor'), 19);
});

test('commit', function(assert) {
  const records = state.get('records');

  for(let i = 1; i <= 10; i++) {
    tm.set('number', i);
    tm.set('squared', i * i);
  }

  assert.equal(records.length, 20);
  assert.equal(state.get('cursor'), 19);

  tm.commit();

  assert.equal(records.length, 0);
  assert.equal(state.get('cursor'), -1);
});

test('recalibration', function(assert) {
  const records = state.get('records');

  tm.set('firstName', 'Offir');
  tm.set('lastName', 'Golan');

  assert.equal(tm.get('lastName'), 'Golan');
  assert.equal(records.length, 2);
  assert.equal(state.get('cursor'), 1);

  tm.undo();

  assert.equal(tm.get('lastName'), undefined);
  assert.equal(records.length, 2);
  assert.equal(state.get('cursor'), 0);

  tm.set('lastName', 'G');

  assert.equal(tm.get('lastName'), 'G');
  assert.equal(records.length, 2);
  assert.equal(state.get('cursor'), 1);
});

test('ignoredProperties - shallow', function(assert) {
  const records = state.get('records');

  ignoredProperties.setObjects(['lastName']);

  tm.set('firstName', 'Offir');

  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), 0);

  tm.set('lastName', 'Golan');

  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), 0);
});

test('ignoredProperties - nested', function(assert) {
  const records = state.get('records');

  content.set('user', Ember.Object.create());
  ignoredProperties.setObjects(['user.lastName']);

  tm.set('user.firstName', 'Offir');

  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), 0);

  tm.set('user.lastName', 'Golan');

  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), 0);
});

test('general test', function(assert) {
  content.setProperties({ A: 'U', B: 'U'});

  tm.set('A', 1);
  tm.set('A', 2);
  tm.set('B', 1);
  tm.set('A', 3);

  tm.undo();

  tm.set('B', 2);
  tm.set('A', 4);
  tm.set('A', 5);

  tm.undo(2, { on: ['A'] });
  tm.undo(1, { on: ['A'] });
  tm.undo();
  tm.redo(2, { on: ['A'] });

  assert.deepEqual(content.getProperties(['A', 'B']), {A: 4, B: 1});
});
