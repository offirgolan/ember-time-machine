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
  records: null,

  // Private
  _meta: null,
  _path: null,
  __isRecordKeeper__: true,

  init() {
    this._super(...arguments);

    const records = this.get('records');
    const path = this.get('_path');
    const meta = this.get('_meta');

    set(this, 'records', isNone(records) ? emberArray() : records);
    set(this, '_path', isNone(path) ? emberArray() : path);
    set(this, '_meta', isNone(meta) ? { currIndex: -1 } : meta);
  },

  unknownProperty(key) {
    const value = this._super(...arguments);

    if(value instanceof Ember.Object && !value.__isRecordKeeper__) {
      return ObjectRecordKeeper.create({
        content: value,
        records: this.get('records'),
        _path: this.get('_path').concat(key),
        _meta: this.get('_meta')
      });
    }

    return value;
  },

  setUnknownProperty(key, value) {
    const records = this.get('records');
    const content = this.get('content');
    let currIndex = this.get('_meta.currIndex');

    if(isNone(records)) {
      return;
    }

    if(currIndex !== records.length - 1) {
      const recordsToRemove = [];
      currIndex++;

      for(; currIndex < records.length; currIndex++) {
        recordsToRemove.push(records[currIndex]);
      }
      records.removeObjects(recordsToRemove);
      this.set('_meta.currIndex', records.length - 1);
    }

    const path = this.get('_path').concat(key).join('.');
    records.pushObject(new Record(path, get(content, key), value));
    this.incrementProperty('_meta.currIndex');

    return this._super(...arguments);
  },

  undo(numRecordsToUndo = 1) {
    const records = this.get('records');
    const currIndex = this.get('_meta.currIndex');

    let recordsToApply = {};
    for(let i = currIndex; i > currIndex - numRecordsToUndo && i >= 0; i--) {
      let record = records.objectAt(i);
      let change = {};
      change[record.key] = record.before;
      assign(recordsToApply, change);
      this.decrementProperty('_meta.currIndex');
    }
    this.get('content').setProperties(recordsToApply);
  },

  undoAll() {
    return this.undo(this.get('_meta.currIndex') + 1);
  },

  redo() {},
  redoAll() {},

  undoWhere() {}, // {key: 'foo'} or { value: 'bar'}
  redoWhere() {}, // {key: 'foo'} or { value: 'bar'}
});
