import Ember from 'ember';
import Snapshot from './Snapshot';

const {
  get,
  set,
  isNone,
  A: emberArray
} = Ember;

const assign = Ember.assign || Ember.merge;

export default Ember.Mixin.create({
  snapshots: null,
  _snapshotIndex: 0,

  init() {
    this._super(...arguments);
    set(this, 'snapshots', emberArray());
  },

  set(key, value) {
    const snapshots = this.get('snapshots');
    const content = this.get('content');

    if(!isNone(snapshots)) {
      snapshots.pushObject(new Snapshot(key, get(content, key), value));
      this.incrementProperty('_snapshotIndex');
    }

    return this._super(...arguments);
  },

  undo(numChanges = 1) {
    const snapshots = this.get('snapshots');
    const maxChanges = snapshots.get('length');

    let snapshotsToApply = {};
    for(let i = maxChanges - 1; i >= maxChanges - numChanges; i--) {
      let snapshot = snapshots.objectAt(i);
      assign(snapshotsToApply, snapshot.before);
    }
    this.get('content').setProperties(snapshotsToApply);
    this.decrementProperty('_snapshotIndex', numChanges);
  },

  undoAll() {
    return this.undo(this.get('snapshots.length'));
  },

  redo() {},
  redoAll() {},

  undoWhere() {}, // {key: 'foo'} or { value: 'bar'}
  redoWhere() {}, // {key: 'foo'} or { value: 'bar'}

});
