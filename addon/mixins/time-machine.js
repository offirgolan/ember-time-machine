import Ember from 'ember';
import shouldIgnoreRecord from 'ember-time-machine/utils/should-ignore-record';
import MachineStates from 'ember-time-machine/-private/machine-states';
import { setObject } from 'ember-time-machine/utils/object';

const {
  isNone,
  isEmpty,
  computed,
  A: emberArray
} = Ember;

export default Ember.Mixin.create({
  ignoredProperties: null,
  inFlight: false,

  // Private
  _path: null,
  _rootMachine: null,
  __isTimeMachine__: true,

  _rootMachineState: computed('_rootMachine', function() {
      return MachineStates.get(this.get('_rootMachine'));
  }).readOnly(),

  canUndo: computed('_rootMachineState.records.[]', '_rootMachineState.currIndex', function() {
    const state = this.get('_rootMachineState');
    return !isEmpty(state.get('records')) && state.get('currIndex') > - 1;
  }),

  canRedo: computed('_rootMachineState.records.[]', '_rootMachineState.currIndex', function() {
    const state = this.get('_rootMachineState');
    const records = state.get('records');

    return !isEmpty(records) && state.get('currIndex') < records.length - 1;
  }),

  init() {
    this._super(...arguments);
    this._setupMachine();
  },

  undo(numUndos = 1) {
    const state = this.get('_rootMachineState');
    let appliedRecords = [];

    if(this.get('canUndo') && !this.get('inFlight')) {
      this.set('inFlight', true);
      appliedRecords = this._applyRecords('undo', state.get('currIndex'), numUndos);
      this.set('inFlight', false);
    }

    return appliedRecords;
  },

  redo(numRedos = 1) {
    const state = this.get('_rootMachineState');
    let appliedRecords = [];

    if(this.get('canRedo') && !this.get('inFlight')) {
      this.set('inFlight', true);
      appliedRecords =  this._applyRecords('redo', state.get('currIndex') + 1, numRedos);
      this.set('inFlight', false);
    }

    return appliedRecords;
  },

  undoAll() {
    const state = this.get('_rootMachineState');
    return this.undo(state.get('currIndex') + 1);
  },

  redoAll() {
    const state = this.get('_rootMachineState');
    return this.redo(state.get('records.length') - state.get('currIndex') - 1);
  },

  commit() {
    const state = this.get('_rootMachineState');
    state.get('records').setObjects([]);
    state.set('currIndex', -1);
  },

  destroy() {
    this._super(...arguments);

    const content = this.get('content');
    const rootMachine = this.get('_rootMachine');
    const availableMachines = this.get('_rootMachineState').availableMachines;

    if(availableMachines.has(content)) {
      availableMachines.delete(content);
    }

    if(rootMachine === this) {
      MachineStates.delete(this);
    }
  },

  _setupMachine() {
    if(isNone(this.get('_rootMachine')) && !MachineStates.has(this)) {
      let availableMachines = new WeakMap();
      let ignoredProperties = this.get('ignoredProperties');

      availableMachines.set(this.get('content'), this);
      MachineStates.set(this, Ember.Object.create({
        currIndex: -1,
        records: emberArray(),
        ignoredProperties: isNone(ignoredProperties) ? emberArray() : ignoredProperties,
        availableMachines
      }));
      this.set('_rootMachine', this);
      this.set('_path', emberArray());
    }
  },

  _recalibrate() {
    const state = this.get('_rootMachineState');
    const records = state.get('records');
    let currIndex = state.get('currIndex');

    if(currIndex !== records.length - 1) {
      const recordsToRemove = [];
      currIndex++;

      for(; currIndex < records.length; currIndex++) {
        recordsToRemove.push(records[currIndex]);
      }
      records.removeObjects(recordsToRemove);
      state.set('currIndex', records.length - 1);
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
    const state = this.get('_rootMachineState');
    const records = state.get('records');

    let recordsApplied = [];
    let currIndex = startIndex;
    let recordCount = 0;
    let direction = (type === 'undo' ? -1 : 1);
    let record, nextRecord;

    for(let i = 0; i < numRecords && currIndex > -1 && currIndex < records.length; i++, currIndex += direction) {
      record = records.objectAt(currIndex);
      nextRecord = records.objectAt(currIndex + direction);
      let isLast = !isNone(nextRecord) || i === numRecords - 1;

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
      } else if(isLast || record.fullPath !== nextRecord.fullPath) {
        /*
          Apply the last object property change that occured in a row.
          ex) If firstName changed 5 times in a row and we undo, then apply only
              the first of the five records. Redo will be the last of the five.
         */
        setObject(record.target, record.key, type === 'undo' ? record.before : record.after);
        recordsApplied.push(record);
      }

      recordCount++;
    }

    state.incrementProperty('currIndex', recordCount * direction);
    return recordsApplied;
  },

  _addRecord(record) {
    const state = this.get('_rootMachineState');

    if(!shouldIgnoreRecord(state.ignoredProperties, record)) {
      this._recalibrate();
      state.get('records').pushObject(Object.freeze(record));
      state.incrementProperty('currIndex');
    }
  }
});
