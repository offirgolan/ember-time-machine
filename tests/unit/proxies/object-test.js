import Ember from 'ember';
import TimeMachine from 'ember-time-machine';
import MachineStates from 'ember-time-machine/-private/machine-states';
import { module, test } from 'qunit';

const {
  run
} = Ember;

let tm, state, content, undoStack, redoStack;
let ignoredProperties, frozenProperties;

module('Unit | Proxy | object', {
  beforeEach() {
    ignoredProperties = Ember.A();
    frozenProperties = Ember.A();
    content = Ember.Object.create();

    tm = TimeMachine.Object.create({
      content,
      ignoredProperties,
      frozenProperties
    });

    state = tm.get('_rootMachineState');
    undoStack = state.get('undoStack');
    redoStack = state.get('redoStack');
  }
});

test('it does not add to undo stack if the primitive value is the same', function(assert) {
  tm.set('firstName', 'Offir');
  tm.set('firstName', 'Offir');
  tm.set('firstName', 'Offir');

  assert.equal(undoStack.length, 1);
});

test('single change detected', function(assert) {
  tm.set('firstName', 'Offir');

  assert.equal(undoStack.length, 1);

  let [record] = undoStack;

  assert.equal(record.type, 'ADD');
  assert.equal(record.before, undefined);
  assert.equal(record.after, 'Offir');
});

test('multiple changes detected', function(assert) {
  for (let i = 1; i <= 10; i++) {
    tm.set('number', i);
    tm.set('squared', i * i);
  }

  assert.equal(undoStack.length, 20);
});

test('undo single change', function(assert) {
  tm.set('firstName', 'Offir');

  assert.equal(tm.get('firstName'), 'Offir');
  assert.equal(undoStack.length, 1);

  tm.undo();

  assert.equal(tm.get('firstName'), undefined);
  assert.equal(redoStack.length, 1);
  assert.equal(undoStack.length, 0);
});

test('undo all changes', function(assert) {
  for (let i = 1; i <= 10; i++) {
    tm.set('number', i);
    tm.set('squared', i * i);
  }

  assert.equal(tm.get('number'), 10);
  assert.equal(tm.get('squared'), 100);
  assert.equal(undoStack.length, 20);

  tm.undoAll();

  assert.equal(tm.get('number'), undefined);
  assert.equal(tm.get('squared'), undefined);
  assert.equal(redoStack.length, 20);
  assert.equal(undoStack.length, 0);
});

test('undo and redo single change', function(assert) {
  tm.set('firstName', 'Offir');

  assert.equal(tm.get('firstName'), 'Offir');
  assert.equal(undoStack.length, 1);

  tm.undo();

  assert.equal(tm.get('firstName'), undefined);
  assert.equal(undoStack.length, 0);
  assert.equal(redoStack.length, 1);

  tm.redo();

  assert.equal(tm.get('firstName'), 'Offir');
  assert.equal(undoStack.length, 1);
  assert.equal(redoStack.length, 0);
});

test('undo and redo all changes', function(assert) {
  for (let i = 1; i <= 10; i++) {
    tm.set('number', i);
    tm.set('squared', i * i);
  }

  assert.equal(tm.get('number'), 10);
  assert.equal(tm.get('squared'), 100);
  assert.equal(undoStack.length, 20);

  tm.undoAll();

  assert.equal(tm.get('number'), undefined);
  assert.equal(tm.get('squared'), undefined);
  assert.equal(redoStack.length, 20);
  assert.equal(undoStack.length, 0);

  tm.redoAll();

  assert.equal(tm.get('number'), 10);
  assert.equal(tm.get('squared'), 100);
  assert.equal(redoStack.length, 0);
  assert.equal(undoStack.length, 20);
});

test('commit', function(assert) {
  for (let i = 1; i <= 10; i++) {
    tm.set('number', i);
    tm.set('squared', i * i);
  }

  assert.equal(undoStack.length, 20);

  tm.commit();

  assert.equal(undoStack.length, 0);
});

test('recalibration', function(assert) {
  tm.set('firstName', 'Offir');
  tm.set('lastName', 'Golan');

  assert.equal(tm.get('lastName'), 'Golan');
  assert.equal(undoStack.length, 2);

  tm.undo();

  assert.equal(tm.get('lastName'), undefined);
  assert.equal(redoStack.length, 1);
  assert.equal(undoStack.length, 1);

  tm.set('lastName', 'G');

  assert.equal(tm.get('lastName'), 'G');
  assert.equal(redoStack.length, 0);
});

test('ignoredProperties - shallow', function(assert) {
  ignoredProperties.setObjects(['lastName']);

  tm.set('firstName', 'Offir');

  assert.equal(undoStack.length, 1);

  tm.set('lastName', 'Golan');

  assert.equal(undoStack.length, 1);
});

test('ignoredProperties - nested', function(assert) {
  content.set('user', Ember.Object.create());
  ignoredProperties.setObjects(['user.lastName']);

  tm.set('user.firstName', 'Offir');

  assert.equal(undoStack.length, 1);

  tm.set('user.lastName', 'Golan');

  assert.equal(undoStack.length, 1);
});

test('frozenProperties - shallow', function(assert) {
  frozenProperties.setObjects(['firstName']);

  tm.set('firstName', 'Offir');

  assert.equal(undoStack.length, 0);
  assert.equal(content.get('firstName'), undefined);

  tm.set('lastName', 'Golan');

  assert.equal(undoStack.length, 1);
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
  let obj = {
    foo: 'bar'
  };
  content.set('foo', obj);

  let availableMachines = state.get('availableMachines');
  let fooMachine = tm.get('foo');

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
  content.setProperties({
    A: 'U',
    B: 'U'
  });

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

  assert.deepEqual(content.getProperties(['A', 'B']), {
    A: 4,
    B: 1
  });
});
