import Ember from 'ember';
import Record from '../-private/Record';
import ObjectRecordKeeper from '../proxies/object';

const {
  get,
  set,
  isNone,
  A: emberArray
} = Ember;

const assign = Ember.assign || Ember.merge;

export default Ember.Mixin.create({
  snapshots: null,
  path: null,
  _didInit: false,
  _meta: null,
  __isRecordKeeper__: true,

  init() {
    this._super(...arguments);

    const snapshots = this.get('snapshots');
    const path = this.get('path');
    const meta = this.get('_meta');

    set(this, 'snapshots', isNone(snapshots) ? emberArray() : snapshots);
    set(this, 'path', isNone(path) ? emberArray() : path);
    set(this, '_meta', isNone(meta) ? { currIndex: -1 } : meta);
  },

  unknownProperty(key) {
    const value = this._super(...arguments);

    if(value instanceof Ember.Object && !value.__isRecordKeeper__) {
      return ObjectRecordKeeper.create({
        content: value,
        snapshots: this.get('snapshots'),
        path: this.get('path').concat(key),
        _meta: this.get('_meta')
      });
    }
    return value;
  },

  setUnknownProperty(key, value) {
    const snapshots = this.get('snapshots');
    const content = this.get('content');

    if(!isNone(snapshots)) {
      const path = this.get('path').concat(key).join('.');
      snapshots.pushObject(new Record(path, get(content, key), value));
      this.incrementProperty('_meta.currIndex');
    }

    return this._super(...arguments);
  },

  undo(numSnapsToUndo = 1) {
    const snapshots = this.get('snapshots');
    const currIndex = this.get('_meta.currIndex');

    let snapshotsToApply = {};
    for(let i = currIndex; i > currIndex - numSnapsToUndo; i--) {
      let snapshot = snapshots.objectAt(i);
      assign(snapshotsToApply, snapshot.before);
    }
    this.get('content').setProperties(snapshotsToApply);
    this.decrementProperty('_meta.currIndex', numSnapsToUndo);
  },

  undoAll() {
    return this.undo(this.get('snapshots.length'));
  },

  redo() {},
  redoAll() {},

  undoWhere() {}, // {key: 'foo'} or { value: 'bar'}
  redoWhere() {}, // {key: 'foo'} or { value: 'bar'}

});
