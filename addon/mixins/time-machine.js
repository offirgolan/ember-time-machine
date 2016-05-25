import Ember from 'ember';
import WeakMap from 'ember-weakmap';
import MachineStates from 'ember-time-machine/-private/machine-states';
import RecordUtils from 'ember-time-machine/utils/record';
import { setObject } from 'ember-time-machine/utils/object';

const {
  isNone,
  isArray,
  isEmpty,
  computed,
  tryInvoke,
  A: emberArray
} = Ember;

export default Ember.Mixin.create({
  /**
   * @property isTimeMachine
   * @type {Boolean}
   */
  isTimeMachine: computed(function() {
    return true;
  }).readOnly(),

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

  /**
   * An array of properties that will not be modified. Allows use of `@each`
   * ex) `['prop', 'obj.array.@each.prop']`
   *
   * @property frozenProperties
   * @type {Array}
   */
  frozenProperties: null,

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
   * Undo the specified amount of changes that were recorded on the root machine
   * and its children
   *
   * ## Options
   *
   * - `on` (**Array**): Only run undo operations on the given keys
   * - `excludes` (**Array**): Exclude undo operations on the given keys
   *
   * @method undo
   * @param  {Object} options
   * @param  {Number} numUndos Amount of undo operations to do. Defaults to 1
   * @return {Array}  All records that were undone
   */
  undo(numUndos = 1, options = {}) {
    const state = this.get('_rootMachineState');
    let appliedRecords = [];

    if(this.get('canUndo') && !this.get('inFlight')) {
      this.set('inFlight', true);
      appliedRecords = this._applyRecords('undo', state.get('currIndex'), numUndos, options);
      this.set('inFlight', false);
    }

    return appliedRecords;
  },

  /**
   * Redo the specified amount of changes that were undone on the root machine
   * and its children
   *
   * ## Options
   *
   * - `on` (**Array**): Only run redo operations on the given keys
   * - `excludes` (**Array**): Exclude redo operations on the given keys
   *
   * @method redo
   * @param  {Number} numRedos Amount of redo operations to do. Defaults to 1
   * @return {Array}  All records that were redone
   */
  redo(numRedos = 1, options = {}) {
    const state = this.get('_rootMachineState');
    let appliedRecords = [];

    if(this.get('canRedo') && !this.get('inFlight')) {
      this.set('inFlight', true);
      appliedRecords =  this._applyRecords('redo', state.get('currIndex') + 1, numRedos, options);
      this.set('inFlight', false);
    }

    return appliedRecords;
  },

  /**
   * Undo all changes that were recorded on the root machine
   * and its children
   *
   * @method undoAll
   * @param  {Object} options
   * @return {Array}  All records that were undone
   */
  undoAll(options = {}) {
    const state = this.get('_rootMachineState');
    return this.undo(state.get('currIndex') + 1, options);
  },

  /**
   * Redo all changes that were undone on the root machine
   * and its children
   *
   * @method redoAll
   * @param  {Object} options
   * @return {Array}  All records that were redone
   */
  redoAll(options = {}) {
    const state = this.get('_rootMachineState');
    return this.redo(state.get('records.length') - state.get('currIndex') - 1, options);
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

  /**
   * Invokes the named method on the content or on every object if the content is an array
   *
   * @method invoke
   * @param {String} methodName the name of the method
   * @param {Object...} args optional arguments to pass as well.
   * @return {Unknown} return values from calling invoke.
   */
  invoke(methodName, ...args) {
    const content = this.get('content');

    if(isArray(content) && this instanceof Ember.ArrayProxy) {
      return this._super(...arguments);
    } else {
      return tryInvoke(content, methodName, args);
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
      let frozenProperties = this.get('frozenProperties');

      // Add root to the collection
      availableMachines.set(this.get('content'), this);

      // Create the new state that will be shared across all children of this content
      MachineStates.set(this, Ember.Object.create({
        currIndex: -1,
        records: emberArray(),
        ignoredProperties: isNone(ignoredProperties) ? [] : ignoredProperties,
        frozenProperties: isNone(frozenProperties) ? [] : frozenProperties,
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
   * Apply the specified number of records give the starting index
   *
   * @method _applyRecords
   * @param  {String}      type       'undo' or 'redo'
   * @param  {Number}      startIndex The starting index
   * @param  {Number}      numRecords Number of records to apply
   * @param  {Object}      options
   * @return {Array}                  Records that were applied
   * @private
   */
  _applyRecords(type /*, startIndex, numRecords, options = {} */) {
    const state = this.get('_rootMachineState');
    const records = state.get('records');
    const currIndex = state.get('currIndex');

    let extractedRecords = this._extractRecords(...arguments);
    let direction = (type === 'undo' ? -1 : 1);
    let insertAtIndex = currIndex + 1;

    extractedRecords.forEach((record, i) => {
      let nextRecord = extractedRecords.objectAt(i + 1);
      let isLast = isNone(nextRecord) || i === extractedRecords.length - 1;

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
      } else if(isLast || record.fullPath !== nextRecord.fullPath) {
        /*
          Apply the last object property change that occured in a row.
          ex) If firstName changed 5 times in a row and we undo, then apply only
              the first of the five records. Redo will be the last of the five.
         */
        setObject(record.target, record.key, type === 'undo' ? record.before : record.after);
      }
    });

    /*
      Flip the record order since undo operations are in reverse and reduce the
      insert index by the extracted record length. This is because currIndex will
      always be greater than records.length due to the record extraction.
     */
    if(type === 'undo') {
      insertAtIndex -= extractedRecords.length;
      extractedRecords.reverseObjects();
    }

    records.splice(insertAtIndex, 0, ...extractedRecords);

    state.incrementProperty('currIndex', extractedRecords.length * direction);

    return extractedRecords;
  },

  /**
   * Extract the specified number of records given the starting index and options
   * from the root machine's record collection
   *
   * @method _extractRecords
   * @param  {String}      type       'undo' or 'redo'
   * @param  {Number}      startIndex The starting index
   * @param  {Number}      numRecords Number of records to apply
   * @param  {Object}      options
   * @return {Array}                  Records that were extracted
   * @private
   */
  _extractRecords(type, startIndex, numRecords, options = {}) {
    const state = this.get('_rootMachineState');
    const records = state.get('records');

    const whitelist = options.on;
    const blacklist = options.excludes;

    let extractedRecords = [];
    let currIndex = startIndex;
    let direction = (type === 'undo' ? -1 : 1);

    for(let i = 0; i < numRecords && currIndex > -1 && currIndex < records.length; currIndex += direction) {
      let record = records.objectAt(currIndex);

      if(isNone(record) ||
         (isArray(whitelist) && !RecordUtils.pathInArray(whitelist, record.fullPath)) ||
         (isArray(blacklist) && RecordUtils.pathInArray(blacklist, record.fullPath))) {
        continue;
      }

      extractedRecords.push(record);
      i++;
    }

    records.removeObjects(extractedRecords);
    return emberArray(extractedRecords);
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

    if(!RecordUtils.pathInArray(state.get('ignoredProperties'), record.fullPath)) {
      this._recalibrate();
      state.get('records').pushObject(Object.freeze(record));
      state.incrementProperty('currIndex');
    }
  }
});
