import Ember from 'ember';
import shouldIgnoreRecord from 'ember-time-machine/utils/should-ignore-record';
import { setObject } from 'ember-time-machine/utils/object';

const {
  isNone,
  isEmpty,
  computed,
  A: emberArray
} = Ember;

function setIfMissing(obj, key, defaultValue) {
  const value = obj.get(key);
  obj.set(key, isNone(value) ? defaultValue : value);
}

export default Ember.Mixin.create({
  records: null,
  ignoredProperties: null,

  // Private
  _meta: null,
  _path: null,
  __isTimeMachine__: true,

  canUndo: computed('records.[]', '_meta.currIndex', function() {
    return !isEmpty(this.get('records')) && this.get('_meta.currIndex') > -1;
  }),

  canRedo: computed('records.[]', '_meta.currIndex', function() {
    const records = this.get('records');
    return !isEmpty(records) && this.get('_meta.currIndex') < records.length - 1;
  }),

  init() {
    this._super(...arguments);

    setIfMissing(this, 'records', emberArray());
    setIfMissing(this, 'ignoredProperties', emberArray());
    setIfMissing(this, '_path', []);
    setIfMissing(this, '_meta',  { currIndex: -1, availableMachines: {}, parent: this });
  },

  undo(numUndos = 1) {
    if(!this.get('canUndo')) {
      return;
    }

    const recordsApplied = this._applyRecords('undo', this.get('_meta.currIndex'), numUndos);
    this.decrementProperty('_meta.currIndex', recordsApplied.total);
    return recordsApplied;
  },

  redo(numRedos = 1) {
    if(!this.get('canRedo')) {
      return;
    }

    const recordsApplied = this._applyRecords('redo', this.get('_meta.currIndex') + 1, numRedos);
    this.incrementProperty('_meta.currIndex', recordsApplied.total);
    return recordsApplied;
  },

  commit() {
    this.get('records').setObjects([]);
    this.set('_meta.currIndex', -1);
  },

  undoAll() {
    return this.undo(this.get('_meta.currIndex') + 1);
  },

  redoAll() {
    return this.redo(this.get('records').length - this.get('_meta.currIndex') - 1);
  },

  _removeRecordsAfterChange() {
    const records = this.get('records');
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
  },

  _undoArrayRecord(array, record) {
    if(record.type === 'ADD') {
      array.replace(record.key, record.after.length, []);
    } else if(record.type === 'DELETE') {
      array.replace(record.key, 0, record.before);
    }
  },

  _redoArrayRecord(array, record) {
    if(record.type === 'ADD') {
      array.replace(record.key, 0, record.after);
    } else if(record.type === 'DELETE') {
      array.replace(record.key, record.before.length, []);
    }
  },

  _applyRecords(type, startIndex, numRecords) {
    const records = this.get('records');
    const content = this.get('content');

    let recordsApplied = [];

    for(let i = 0; i < numRecords && startIndex > -1 && startIndex < records.length; i++) {
      let record = records.objectAt(startIndex);

      if(isNone(record)) {
        continue;
      }

      if(record.isArray) {
        let array = content.get(record.pathString);

        if(type === 'undo') {
          this._undoArrayRecord(array, record);
        } else {
          this._redoArrayRecord(array, record);
        }
      } else {
        setObject(content, record.fullPath, type === 'undo' ? record.before : record.after);
      }

      startIndex += (type === 'undo' ? -1 : 1);
      recordsApplied.push(record);
    }

    return recordsApplied;
  },

  _addRecord(record) {
    if(!shouldIgnoreRecord(this.get('ignoredProperties'), record)) {
      this.get('records').pushObject(record);
      this.incrementProperty('_meta.currIndex');
    }
  }
});
