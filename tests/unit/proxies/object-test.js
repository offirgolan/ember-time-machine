import Ember from 'ember';
import TimeMachine from 'ember-time-machine';
import MachineStates from 'ember-time-machine/-private/machine-states';
import { module, test } from 'qunit';

const {
  run
} = Ember;

let tm, state, content, ignoredProperties, frozenProperties;

module('Unit | Proxy | object', {
  beforeEach() {
    ignoredProperties = Ember.A();
    frozenProperties = Ember.A();
    content = Ember.Object.create();
    tm =  TimeMachine.Object.create({
      content, ignoredProperties, frozenProperties
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

test('frozenProperties - shallow', function(assert) {
  const records = state.get('records');

  frozenProperties.setObjects(['firstName']);

  tm.set('firstName', 'Offir');

  assert.equal(records.length, 0);
  assert.equal(state.get('cursor'), -1);
  assert.equal(content.get('firstName'), undefined);

  tm.set('lastName', 'Golan');

  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), 0);
  assert.equal(content.get('lastName'), 'Golan');
});

test('invoke', function(assert) {
  assert.expect(2);
  content.set('save', () => assert.ok(true));

  tm.invoke('save');
  tm.invoke('set', 'foo', 'bar');

  assert.equal(content.get('foo'), 'bar');
});

test('shouldWrapValue', function(assert) {
  class Foo {}

  tm.set('foo', new Foo());
  assert.ok(tm.get('foo').get('isTimeMachine'));

  state.set('shouldWrapValue', (value) => {
    return !(value instanceof Foo);
  });

  tm.set('foo', new Foo());
  assert.ok(tm.get('foo') instanceof Foo);
});

test('destroy', function(assert) {
  let obj = { foo: 'bar' };
  content.set('foo', obj);

  const availableMachines = state.get('availableMachines');
  const fooMachine = tm.get('foo');

  assert.ok(fooMachine.get('isTimeMachine'));
  assert.ok(availableMachines.has(obj));
  assert.ok(MachineStates.has(tm));

  run(() => {
    fooMachine.destroy();
    tm.destroy();
  });

  assert.notOk(availableMachines.has(obj));
  assert.notOk(MachineStates.has(tm));

});

test('general test - date', function(assert) {
  content.set('date', '');

  tm.set('date', new Date('1/1/01'));

  assert.ok(tm.get('date') instanceof Date);
  assert.equal(tm.get('date').getFullYear(), '2001');

  tm.set('date', new Date('2/2/02'));
  assert.equal(tm.get('date').getFullYear(), '2002');

  tm.undo();

  assert.equal(tm.get('date').getFullYear(), '2001');
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
