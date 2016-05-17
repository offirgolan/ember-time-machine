import Ember from 'ember';
import shouldIgnoreRecord from 'ember-time-machine/utils/should-ignore-record';
import { setObject } from 'ember-time-machine/utils/object';

const {
  isNone,
  isEmpty,
  computed,
  A: emberArray
} = Ember;

function setIfNone(obj, key, defaultValue) {
  const value = obj.get(key);
  obj.set(key, isNone(value) ? defaultValue : value);
}

export default Ember.Mixin.create({
  records: null,
  ignoredProperties: null,
  inFlight: false,

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
    this._setupMachine();
  },

  undo(numUndos = 1) {
    let appliedRecords = [];

    if(this.get('canUndo') && !this.get('inFlight')) {
      this.set('inFlight', true);
      appliedRecords = this._applyRecords('undo', this.get('_meta.currIndex'), numUndos);
      this.set('inFlight', false);
    }

    return appliedRecords;
  },

  redo(numRedos = 1) {
    let appliedRecords = [];

    if(this.get('canRedo') && !this.get('inFlight')) {
      this.set('inFlight', true);
      appliedRecords =  this._applyRecords('redo', this.get('_meta.currIndex') + 1, numRedos);
      this.set('inFlight', false);
    }

    return appliedRecords;
  },

  undoAll() {
    return this.undo(this.get('_meta.currIndex') + 1);
  },

  redoAll() {
    return this.redo(this.get('records').length - this.get('_meta.currIndex') - 1);
  },

  commit() {
    this.get('records').setObjects([]);
    this.set('_meta.currIndex', -1);
  },

  _setupMachine() {
    setIfNone(this, 'records', emberArray());
    setIfNone(this, 'ignoredProperties', emberArray());
    setIfNone(this, '_path', []);
    setIfNone(this, '_meta',  { currIndex: -1, availableMachines: {}, rootMachine: this });
  },

  _recalibrate() {
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

    let recordsApplied = [];

    for(let i = 0; i < numRecords && startIndex > -1 && startIndex < records.length; i++) {
      let record = records.objectAt(startIndex);

      if(isNone(record)) {
        continue;
      }

      if(record.isArray) {
        if(type === 'undo') {
          this._undoArrayRecord(record.target, record);
        } else {
          this._redoArrayRecord(record.target, record);
        }
      } else {
        setObject(record.target, record.key, type === 'undo' ? record.before : record.after);
      }

      startIndex += (type === 'undo' ? -1 : 1);
      recordsApplied.push(record);
    }

    this.incrementProperty('_meta.currIndex', recordsApplied.length * (type === 'undo' ? -1 : 1));
    return recordsApplied;
  },

  _addRecord(record) {
    if(!shouldIgnoreRecord(this.get('ignoredProperties'), record)) {
      this._recalibrate();
      this.get('records').pushObject(Object.freeze(record));
      this.incrementProperty('_meta.currIndex');
    }
  }
});
