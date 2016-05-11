import Ember from 'ember';
import Record from '../-private/Record';
import ObjectRecordKeeper from '../proxies/object';

const {
  get,
  set,
  isNone,
  isEmpty,
  computed,
  A: emberArray
} = Ember;

const assign = Ember.assign || Ember.merge;

export default Ember.Mixin.create({
  records: null,

  // Private
  _meta: null,
  _path: null,
  __isRecordKeeper__: true,

  canUndo: computed('records.[]', '_meta.currIndex', function() {
    return !isEmpty(this.get('records')) && this.get('_meta.currIndex') > -1;
  }),

  canRedo: computed('records.[]', '_meta.currIndex', function() {
    const records = this.get('records');
    return !isEmpty(records) && this.get('_meta.currIndex') < records.length - 1;
  }),

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

  undo(numUndos = 1) {
    const records = this.get('records');
    let currIndex = this.get('_meta.currIndex');
    let recordsToApply = {};

    if(!this.get('canUndo')) {
      return;
    }

    for(let i = numUndos; i > 0 && currIndex > -1; i--) {
      let record = records.objectAt(currIndex);
      if(!isNone(record)) {
        let change = {};
        change[record.key] = record.before;
        assign(recordsToApply, change);
        currIndex--;
      }
    }

    this.get('content').setProperties(recordsToApply);
    this.set('_meta.currIndex', currIndex);
  },

  undoAll() {
    return this.undo(this.get('_meta.currIndex') + 1);
  },

  redo(numRedos = 1) {
    const records = this.get('records');
    let currIndex = this.get('_meta.currIndex');
    let recordsToApply = {};

    if(!this.get('canRedo')) {
      return;
    }

    for(let i = numRedos; i > 0 && currIndex < records.length; i--) {
      let record = records.objectAt(currIndex + 1);
      if(!isNone(record)) {
        let change = {};
        change[record.key] = record.after;
        assign(recordsToApply, change);
        currIndex++;
      }
    }

    this.get('content').setProperties(recordsToApply);
    this.set('_meta.currIndex', currIndex);
  },

  redoAll() {
    return this.redo(this.get('records').length - this.get('_meta.currIndex') - 1);
  },

  undoWhere() {}, // {key: 'foo'} or { value: 'bar'}
  redoWhere() {}, // {key: 'foo'} or { value: 'bar'},
});
