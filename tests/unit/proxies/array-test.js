import Ember from 'ember';
import TimeMachine from 'ember-time-machine';
import { module, test } from 'qunit';

const {
  A: emberArray
} = Ember;

let tm, state, content, ignoredProperties;

module('Unit | Proxy | array', {
  beforeEach() {
    ignoredProperties = Ember.A();
    content = Ember.A();
    tm =  TimeMachine.Array.create({
      content, ignoredProperties
    });

    state = tm.get('_rootMachineState');
  }
});


test('single change detected', function(assert) {
  const records = state.get('records');

  tm.pushObject('Offir');

  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), 0);

  let record = records[0];

  assert.equal(record.type, 'ADD');
  assert.equal(record.isArray, true);
  assert.equal(record.before, undefined);
  assert.deepEqual(record.after, ['Offir']);
});

test('multiple changes detected', function(assert) {
  const records = state.get('records');

  for(let i = 1; i <= 10; i++) {
    tm.pushObject(i);
  }

  assert.equal(records.length, 10);
  assert.equal(state.get('cursor'), 9);
});

test('undo single change - ADD', function(assert) {
  const records = state.get('records');

  tm.pushObject('Offir');

  assert.equal(tm.objectAt(0), 'Offir');
  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), 0);

  tm.undo();

  assert.equal(tm.objectAt(0), undefined);
  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), -1);
});

test('undo single change - DELETE', function(assert) {
  const records = state.get('records');

  content.pushObject('Offir');

  tm.removeAt(0);

  assert.equal(tm.objectAt(0), undefined);
  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), 0);

  tm.undo();

  assert.equal(tm.objectAt(0), 'Offir');
  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), -1);
});

test('undo all changes', function(assert) {
  const records = state.get('records');

  for(let i = 1; i <= 10; i++) {
    tm.pushObject(i);
  }

  assert.equal(tm.objectAt(0), 1);
  assert.equal(records.length, 10);
  assert.equal(state.get('cursor'), 9);

  tm.undoAll();

  assert.equal(tm.objectAt(0), undefined);
  assert.equal(records.length, 10);
  assert.equal(state.get('cursor'), -1);
});

test('undo and redo single change - ADD', function(assert) {
  const records = state.get('records');

  tm.pushObject('Offir');

  assert.equal(tm.objectAt(0), 'Offir');
  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), 0);

  tm.undo();

  assert.equal(tm.objectAt(0), undefined);
  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), -1);

  tm.redo();

  assert.equal(tm.objectAt(0), 'Offir');
  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), 0);
});

test('undo and redo single change - DELETE', function(assert) {
  const records = state.get('records');

  content.pushObject('Offir');

  tm.removeAt(0);

  assert.equal(tm.objectAt(0), undefined);
  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), 0);

  tm.undo();

  assert.equal(tm.objectAt(0), 'Offir');
  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), -1);

  tm.redo();

  assert.equal(tm.objectAt(0), undefined);
  assert.equal(records.length, 1);
  assert.equal(state.get('cursor'), 0);
});

test('undo and redo all changes', function(assert) {
  const records = state.get('records');

  for(let i = 1; i <= 10; i++) {
    tm.pushObject(i);
  }

  assert.equal(tm.objectAt(0), 1);
  assert.equal(records.length, 10);
  assert.equal(state.get('cursor'), 9);

  tm.undoAll();

  assert.equal(tm.objectAt(0), undefined);
  assert.equal(records.length, 10);
  assert.equal(state.get('cursor'), -1);

  tm.redoAll();

  assert.equal(tm.objectAt(0), 1);
  assert.equal(records.length, 10);
  assert.equal(state.get('cursor'), 9);
});

test('commit', function(assert) {
  const records = state.get('records');

  for(let i = 1; i <= 10; i++) {
    tm.pushObject(i);
  }

  assert.equal(tm.objectAt(0), 1);
  assert.equal(records.length, 10);
  assert.equal(state.get('cursor'), 9);

  tm.commit();

  assert.equal(records.length, 0);
  assert.equal(state.get('cursor'), -1);
});

test('recalibration', function(assert) {
  const records = state.get('records');

  tm.pushObject('Offir');
  tm.pushObject('Golan');

  assert.equal(tm.objectAt(1), 'Golan');
  assert.equal(records.length, 2);
  assert.equal(state.get('cursor'), 1);

  tm.undo();

  assert.equal(tm.objectAt(1), undefined);
  assert.equal(records.length, 2);
  assert.equal(state.get('cursor'), 0);

  tm.pushObject('G');

  assert.equal(tm.objectAt(1), 'G');
  assert.equal(records.length, 2);
  assert.equal(state.get('cursor'), 1);
});


test('ignoredProperties - nested', function(assert) {
  const records = state.get('records');

  content.pushObject(Ember.Object.create());
  content.pushObject(Ember.Object.create());

  ignoredProperties.setObjects(['@each.lastName']);

  tm.objectAt(0).set('firstName', 'Offir');
  tm.objectAt(1).set('firstName', 'David');

  assert.equal(records.length, 2);
  assert.equal(state.get('cursor'), 1);

  tm.objectAt(0).set('lastName', 'Golan');
  tm.objectAt(1).set('lastName', 'Golan');

  assert.equal(records.length, 2);
  assert.equal(state.get('cursor'), 1);
});

test('invoke', function(assert) {
  assert.expect(2);

  const Obj = Ember.Object.extend({
    save() {
      assert.ok(true);
    }
  });

  content.setObjects(emberArray([Obj.create(), Obj.create()]));

  tm.invoke('save');
});
