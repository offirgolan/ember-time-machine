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
    let currIndex = startIndex;
    let recordCount = 0;
    let direction = (type === 'undo' ? -1 : 1);
    let record, nextRecord;

    for(let i = 0; i < numRecords && currIndex > -1 && currIndex < records.length; i++) {
      record = records.objectAt(currIndex);
      nextRecord = records.objectAt(currIndex + direction);

      if(isNone(record)) {
        continue;
      }

      /*
        Array operations must be done one a time since it will be
        more expensive to clone the array, do the operations on the clone, then
        apply the updated cloned array on the target.
       */
      if(record.isArray) {
        if(type === 'undo') {
          this._undoArrayRecord(record.target, record);
        } else {
          this._redoArrayRecord(record.target, record);
        }
        recordsApplied.push(record);
      } else if(!nextRecord || record.fullPath !== nextRecord.fullPath) {
        /*
          Apply the last object property change that occured in a row.
          ex) If firstName changed 5 times in a row and we undo, then apply only
              the first of the five records. Redo will be the last of the five.
         */
        setObject(record.target, record.key, type === 'undo' ? record.before : record.after);
        recordsApplied.push(record);
      }

      currIndex += direction;
      recordCount++;
    }

    this.incrementProperty('_meta.currIndex', recordCount * direction);
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
