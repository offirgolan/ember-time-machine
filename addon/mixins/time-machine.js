import Ember from 'ember';
import shouldIgnoreRecord from '../utils/should-ignore-record';
import { setObject } from '../utils/object';

const {
  set,
  isNone,
  isEmpty,
  computed,
  A: emberArray
} = Ember;


export default Ember.Mixin.create({
  records: null,
  ignoredProperties: null,

  // Private
  _meta: null,
  _path: null,

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
    const ignoredProperties = this.get('ignoredProperties');
    const path = this.get('_path');
    const meta = this.get('_meta');

    set(this, 'records', isNone(records) ? emberArray() : records);
    set(this, 'ignoredProperties', isNone(ignoredProperties) ? [] : ignoredProperties);
    set(this, '_path', isNone(path) ? [] : path);
    set(this, '_meta', isNone(meta) ? { currIndex: -1 } : meta);
  },

  undo(numUndos = 1) {
    if(!this.get('canUndo')) {
      return;
    }

    const changes = this._getRecords('undo', this.get('_meta.currIndex'), numUndos);

    this._applyArrayRecords('undo', changes.array);
    this._applyObjectRecords('undo', changes.object);

    this.decrementProperty('_meta.currIndex', changes.total);
  },

  redo(numRedos = 1) {
    if(!this.get('canRedo')) {
      return;
    }

    const changes = this._getRecords('redo', this.get('_meta.currIndex') + 1, numRedos);

    this._applyArrayRecords('redo', changes.array);
    this._applyObjectRecords('redo', changes.object);

    this.incrementProperty('_meta.currIndex', changes.total);
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

  _applyObjectRecords(type, records) {
    const content = this.get('content');

    Object.keys(records).forEach(path => {
      const record = records[path];
      setObject(content, record.fullPath, type === 'undo' ? record.before : record.after);
    });
  },

  _applyArrayRecords(type, records) {
    const content = this.get('content');

    Object.keys(records).forEach(path => {
      const propRecords = records[path];
      const array = content.get(path);
      let arrayClone = emberArray(array.slice(0));

      propRecords.forEach(record => {
        if(type === 'undo') {
          this._undoArrayRecord(arrayClone, record);
        } else {
          this._redoArrayRecord(arrayClone, record);
        }
      });

      array.replace(0, array.get('length'), arrayClone);
    });
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

  _getRecords(type, startIndex, numRecords) {
    const records = this.get('records');
    const recordsObj = {
      array: {},
      object: {},
      total: 0
    };

    for(let i = 0; i < numRecords && startIndex > -1 && startIndex < records.length; i++) {
      let record = records.objectAt(startIndex);

      if(isNone(record)) {
        continue;
      }

      if(record.isArray) {
        recordsObj.array[record.pathString] = recordsObj.array[record.pathString] || [];
        recordsObj.array[record.pathString].push(record);
      } else {
        recordsObj.object[record.fullPath] = record;
      }

      startIndex += type === 'undo' ? -1 : 1;
      recordsObj.total++;
    }

    return recordsObj;
  },

  _addRecord(record) {
    if(!shouldIgnoreRecord(this.get('ignoredProperties'), record)) {
      this.get('records').pushObject(record);
      this.incrementProperty('_meta.currIndex');
    }
  }
});
