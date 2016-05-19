import Ember from 'ember';
import WeakMap from 'ember-weakmap';
import MachineStates from 'ember-time-machine/-private/machine-states';
import RecordUtils from 'ember-time-machine/utils/record';
import { setObject } from 'ember-time-machine/utils/object';

const {
  isNone,
  isEmpty,
  computed,
  A: emberArray
} = Ember;

export default Ember.Mixin.create({
  __isTimeMachine__: true,

  /**
   * A flag set when the machine is working. Toggled during undo and redo.
   *
   * @property inFlight
   * @type {Boolean}
   * @default false
   */
  inFlight: false,

  /**
   * An array of properties to ignore. Allows use of `@each`
   * ex) `['prop', 'obj.array.@each.prop']`
   *
   * @property ignoredProperties
   * @type {Array}
   */
  ignoredProperties: null,

  // Private

  /**
   * Path from root machine to this one
   *
   * @property _path
   * @type {Array}
   * @private
   */
  _path: null,

  /**
   * Reference to the root machine. This is used to retrieve the state
   * of the root machine and all its children
   *
   * @property _rootMachine
   * @type {TimeMachine}
   * @private
   */
  _rootMachine: null,

  /**
   * The state of the root machine that is also shared with all its children
   *
   * @property _rootMachineState
   * @type {Ember.Object}
   * @private
   */
  _rootMachineState: computed('_rootMachine', function() {
      return MachineStates.get(this.get('_rootMachine'));
  }).readOnly(),


  /**
   * Determines if undo operations can be done
   *
   * @property canUndo
   * @type {Boolean}
   */
  canUndo: computed('_rootMachineState.records.[]', '_rootMachineState.currIndex', function() {
    const state = this.get('_rootMachineState');
    return !isEmpty(state.get('records')) && state.get('currIndex') > - 1;
  }),

  /**
   * Determines if redo operations can be done
   *
   * @property canRedo
   * @type {Boolean}
   */
  canRedo: computed('_rootMachineState.records.[]', '_rootMachineState.currIndex', function() {
    const state = this.get('_rootMachineState');
    const records = state.get('records');

    return !isEmpty(records) && state.get('currIndex') < records.length - 1;
  }),

  init() {
    this._super(...arguments);
    this._setupMachine();
  },

  /**
   * Undo the specified amount of changes that were recorded on the root machine
   * and its children
   *
   * @method undo
   * @param  {Number} numUndos Amount of undo operations to do. Defaults to 1
   * @return {Array}  All records that were undone
   */
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

  /**
   * Redo the specified amount of changes that were undone on the root machine
   * and its children
   *
   * @method redo
   * @param  {Number} numRedos Amount of redo operations to do. Defaults to 1
   * @return {Array}  All records that were redone
   */
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

  /**
   * Undo all changes that were recorded on the root machine
   * and its children
   *
   * @method undoAll
   * @return {Array}  All records that were undone
   */
  undoAll() {
    const state = this.get('_rootMachineState');
    return this.undo(state.get('currIndex') + 1);
  },

  /**
   * Redo all changes that were undone on the root machine
   * and its children
   *
   * @method redoAll
   * @return {Array}  All records that were redone
   */
  redoAll() {
    const state = this.get('_rootMachineState');
    return this.redo(state.get('records.length') - state.get('currIndex') - 1);
  },

  /**
   * Clears all recorded changes and resets the state of the root machine and
   * all its children
   *
   * @method commit
   */
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

  /**
   * If this machine is the root machine, setup the necessary state and add it
   * to the global MachineStates map
   *
   * @method _setupMachine
   * @private
   */
  _setupMachine() {
    if(isNone(this.get('_rootMachine')) && !MachineStates.has(this)) {
      let availableMachines = new WeakMap();
      let ignoredProperties = this.get('ignoredProperties');

      // Add root to the collection
      availableMachines.set(this.get('content'), this);

      // Create the new state that will be shared across all children of this content
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

  /**
   * If the current index is not at the top of the stack, remove all records
   * above it. This gets called before every record is added and is needed when
   * undo is called then a record is added.
   *
   * @method _recalibrate
   * @private
   */
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

  /**
   * Apply the specified number of records give the starting index.
   *
   * @method _applyRecords
   * @param  {String}      type       'undo' or 'redo'
   * @param  {Number}      startIndex The starting index
   * @param  {Number}      numRecords Number of records to apply
   * @return {Array}                  Records that were applied
   * @private
   */
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
          RecordUtils.undoArrayRecord(record);
        } else {
          RecordUtils.redoArrayRecord(record);
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

  /**
   * Add a record to records collection. Calling this method will also freeze
   * the record via `Object.freeze` to disabled any modifications to its content
   *
   * @method _addRecord
   * @param  {Record}   record
   */
  _addRecord(record) {
    const state = this.get('_rootMachineState');

    if(!RecordUtils.ignoreRecord(state.get('ignoredProperties'), record)) {
      this._recalibrate();
      state.get('records').pushObject(Object.freeze(record));
      state.incrementProperty('currIndex');
    }
  }
});
