import Ember from 'ember';
import TimeMachine from 'ember-time-machine';
import { module, test } from 'qunit';

const {
  A: emberArray
} = Ember;

let tm, state, content, undoStack, redoStack;
let ignoredProperties, frozenProperties;

module('Unit | Proxy | array', {
  beforeEach() {
    ignoredProperties = Ember.A();
    frozenProperties = Ember.A();
    content = Ember.A();

    tm = TimeMachine.Array.create({
      content,
      ignoredProperties,
      frozenProperties
    });

    state = tm.get('_rootMachineState');
    undoStack = state.get('undoStack');
    redoStack = state.get('redoStack');
  }
});

test('single change detected', function(assert) {
  tm.pushObject('Offir');

  assert.equal(undoStack.length, 1);

  let [changeSet] = undoStack;
  let [record] = changeSet;

  assert.equal(record.type, 'ADD');
  assert.equal(record.isArray, true);
  assert.equal(record.before, undefined);
  assert.deepEqual(record.after, ['Offir']);
});

test('multiple changes detected', function(assert) {
  for (let i = 1; i <= 10; i++) {
    tm.pushObject(i);
  }

  assert.equal(undoStack.length, 10);
});

test('undo single change - ADD', function(assert) {
  tm.pushObject('Offir');

  assert.equal(tm.objectAt(0), 'Offir');
  assert.equal(undoStack.length, 1);

  tm.undo();

  assert.equal(tm.objectAt(0), undefined);
  assert.equal(redoStack.length, 1);
  assert.equal(undoStack.length, 0);
});

test('undo single change - DELETE', function(assert) {
  content.pushObject('Offir');

  tm.removeAt(0);

  assert.equal(tm.objectAt(0), undefined);
  assert.equal(undoStack.length, 1);

  tm.undo();

  assert.equal(tm.objectAt(0), 'Offir');
  assert.equal(redoStack.length, 1);
  assert.equal(undoStack.length, 0);
});

test('undo all changes', function(assert) {
  for (let i = 1; i <= 10; i++) {
    tm.pushObject(i);
  }

  assert.equal(tm.objectAt(0), 1);
  assert.equal(undoStack.length, 10);

  tm.undoAll();

  assert.equal(tm.objectAt(0), undefined);
  assert.equal(redoStack.length, 10);
  assert.equal(undoStack.length, 0);
});

test('undo and redo single change - ADD', function(assert) {
  tm.pushObject('Offir');

  assert.equal(tm.objectAt(0), 'Offir');
  assert.equal(undoStack.length, 1);

  tm.undo();

  assert.equal(tm.objectAt(0), undefined);
  assert.equal(redoStack.length, 1);
  assert.equal(undoStack.length, 0);

  tm.redo();

  assert.equal(tm.objectAt(0), 'Offir');
  assert.equal(redoStack.length, 0);
  assert.equal(undoStack.length, 1);
});

test('undo and redo single change - DELETE', function(assert) {
  content.pushObject('Offir');

  tm.removeAt(0);

  assert.equal(tm.objectAt(0), undefined);
  assert.equal(undoStack.length, 1);

  tm.undo();

  assert.equal(tm.objectAt(0), 'Offir');
  assert.equal(redoStack.length, 1);
  assert.equal(undoStack.length, 0);

  tm.redo();

  assert.equal(tm.objectAt(0), undefined);
  assert.equal(redoStack.length, 0);
  assert.equal(undoStack.length, 1);
});

test('undo and redo all changes', function(assert) {
  for (let i = 1; i <= 10; i++) {
    tm.pushObject(i);
  }

  assert.equal(tm.objectAt(0), 1);
  assert.equal(undoStack.length, 10);

  tm.undoAll();

  assert.equal(tm.objectAt(0), undefined);
  assert.equal(redoStack.length, 10);
  assert.equal(undoStack.length, 0);

  tm.redoAll();

  assert.equal(tm.objectAt(0), 1);
  assert.equal(redoStack.length, 0);
  assert.equal(undoStack.length, 10);
});

test('commit', function(assert) {
  for (let i = 1; i <= 10; i++) {
    tm.pushObject(i);
  }

  assert.equal(tm.objectAt(0), 1);
  assert.equal(undoStack.length, 10);

  tm.commit();

  assert.equal(undoStack.length, 0);
});

test('recalibration', function(assert) {
  tm.pushObject('Offir');
  tm.pushObject('Golan');

  assert.equal(tm.objectAt(1), 'Golan');
  assert.equal(undoStack.length, 2);

  tm.undo();

  assert.equal(tm.objectAt(1), undefined);
  assert.equal(redoStack.length, 1);
  assert.equal(undoStack.length, 1);

  tm.pushObject('G');

  assert.equal(tm.objectAt(1), 'G');
  assert.equal(redoStack.length, 0);
});

test('ignoredProperties - nested', function(assert) {
  content.pushObject(Ember.Object.create());
  content.pushObject(Ember.Object.create());

  ignoredProperties.setObjects(['@each.lastName']);

  tm.objectAt(0).set('firstName', 'Offir');
  tm.objectAt(1).set('firstName', 'David');

  assert.equal(undoStack.length, 2);

  tm.objectAt(0).set('lastName', 'Golan');
  tm.objectAt(1).set('lastName', 'Golan');

  assert.equal(undoStack.length, 2);
});

test('invoke', function(assert) {
  assert.expect(2);

  let Obj = Ember.Object.extend({
    save() {
      assert.ok(true);
    }
  });

  content.setObjects(emberArray([Obj.create(), Obj.create()]));

  tm.invoke('save');
});
