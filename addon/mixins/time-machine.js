import Ember from 'ember';
import WeakMap from 'ember-weakmap';
import MachineStates from 'ember-time-machine/-private/machine-states';
import RecordUtils from 'ember-time-machine/utils/record';
import { setObject } from 'ember-time-machine/utils/object';
import { pathInGlobs } from 'ember-time-machine/utils/utils';

const {
  isNone,
  isArray,
  isEmpty,
  computed,
  tryInvoke,
  Logger,
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
   * The maximum depth in which to allow tracking changes emitted by children of the receiver.
   * If set to `-1`, all nested children will be tracked.
   *
   * @property maxDepth
   * @type {Number}
   * @default -1
   */
  maxDepth: -1,

  /**
   * Currently, any value of type `instance`, `object`, and `array` (via Ember.typeOf) will automatically
   * be wrapped in their own Time Machine. If you don't want specific values to be wrapped,
   * this is the place to do it.
   *
   * @property shouldWrapValue
   * @type {Function}
   */
  shouldWrapValue: null,

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
  canUndo: computed.notEmpty('_rootMachineState.undoStack').readOnly(),

  /**
   * Determines if redo operations can be done
   *
   * @property canRedo
   * @type {Boolean}
   */
  canRedo: computed.notEmpty('_rootMachineState.redoStack').readOnly(),

  _changeInProgress: false,

  _totalChangesInProgress: 0,

  init() {
    this._super(...arguments);
    this._setupMachine();
    // this._setProperties = this.setProperties;
    // this.setProperties = function(properties) {
    //   const undoTotal = this.get('_rootMachineState.undoTotal');
    //   undoTotal.push(Object.keys(properties).length);
    //   return this._setProperties(properties);
    // };
  },

  startTimeMachine() {
    this._changeInProgress = true;
  },

  stopTimeMachine() {
    const undoTotal = this.get('_rootMachineState.undoTotal');
    undoTotal.push(this._totalChangesInProgress);
    this._totalChangesInProgress = 0;
    this._changeInProgress = false;
  },

  destroy() {
    this._super(...arguments);

    let content = this.get('content');
    let rootMachine = this.get('_rootMachine');
    let availableMachines = this.get('_rootMachineState.availableMachines');

    if (availableMachines.has(content)) {
      availableMachines.delete(content);
    }

    if (rootMachine === this) {
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
    let state = this.get('_rootMachineState');
    let appliedRecords = [];

    if (this.get('canUndo')) {
      numUndos = state.get('undoTotal').pop();
      console.log('undoing', numUndos);
      appliedRecords = this._applyRecords('undo', numUndos, options);
      state.get('redoStack').pushObjects(appliedRecords);
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
    let state = this.get('_rootMachineState');
    let appliedRecords = [];

    if (this.get('canRedo')) {
      appliedRecords = this._applyRecords('redo', numRedos, options);
      state.get('undoStack').pushObjects(appliedRecords);
      state.get('undoTotal').push(numRedos);
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
    let state = this.get('_rootMachineState');
    return this.undo(state.get('undoStack.length'), options);
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
    let state = this.get('_rootMachineState');
    return this.redo(state.get('redoStack.length'), options);
  },

  /**
   * Clears all recorded changes and resets the state of the root machine and
   * all its children
   *
   * @method commit
   */
  commit() {
    let state = this.get('_rootMachineState');
    state.get('undoStack').setObjects([]);
    state.get('redoStack').setObjects([]);
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
    let content = this.get('content');

    if (isArray(content)) {
      return emberArray(content).invoke(methodName, ...args);
    } else {
      return tryInvoke(content, methodName, args);
    }
  },

  /**
   * Neatly prints all current records to console
   *
   * @method printRecords
   * @param {Array} properties override the properties to display
   */
  printRecords(properties) {
    let state = this.get('_rootMachineState');

    Logger.debug('+====================================== Undo Stack ======================================+');
    console.table(state.get('undoStack'), properties || ['fullPath', 'before', 'after', 'type', 'timestamp']);
    Logger.debug('+====================================== Redo Stack ======================================+');
    console.table(state.get('redoStack'), properties || ['fullPath', 'before', 'after', 'type', 'timestamp']);
    Logger.debug('+========================================================================================+');

    Logger.debug('Content: ', this.get('content'));
  },

  /**
   * If this machine is the root machine, setup the necessary state and add it
   * to the global MachineStates map
   *
   * @method _setupMachine
   * @private
   */
  _setupMachine() {
    if (isNone(this.get('_rootMachine')) && !MachineStates.has(this)) {
      let {
        ignoredProperties,
        frozenProperties,
        maxDepth,
        shouldWrapValue
      } = this.getProperties(['ignoredProperties', 'frozenProperties', 'maxDepth', 'shouldWrapValue']);
      let availableMachines = new WeakMap();

      // Add root to the collection
      availableMachines.set(this.get('content'), this);

      // Create the new state that will be shared across all children of this content
      MachineStates.set(this, Ember.Object.create({
        undoStack: emberArray(),
        redoStack: emberArray(),
        undoTotal: emberArray(),
        ignoredProperties: isNone(ignoredProperties) ? [] : ignoredProperties,
        frozenProperties: isNone(frozenProperties) ? [] : frozenProperties,
        shouldWrapValue: isNone(shouldWrapValue) ? () => true : shouldWrapValue,
        maxDepth,
        availableMachines
      }));

      this.setProperties({
        _rootMachine: this,
        _path: emberArray()
      });
    }
  },

  /**
   * Apply the specified number of records given from either the undo or redo
   * stack
   *
   * @method _applyRecords
   * @param  {String}      type       'undo' or 'redo'
   * @param  {Number}      numRecords Number of records to apply
   * @param  {Object}      options
   * @return {Array}                  Records that were applied
   * @private
   */
  _applyRecords(type, numRecords, options = {}) {
    let state = this.get('_rootMachineState');
    let stack = state.get(`${type}Stack`);
    let extractedRecords = this._extractRecords(stack, numRecords, options);

    extractedRecords.forEach((record, i) => {
      let nextRecord = extractedRecords.objectAt(i + 1);
      let isLast = isNone(nextRecord) || i === extractedRecords.length - 1;

      /*
        Array operations must be done one a time since it will be
        more expensive to clone the array, do the operations on the clone, then
        apply the updated cloned array on the target.
       */
      if (record.isArray) {
        if (type === 'undo') {
          RecordUtils.undoArrayRecord(record);
        } else {
          RecordUtils.redoArrayRecord(record);
        }
      } else if (isLast ||
          record.fullPath !== nextRecord.fullPath ||
          record.target !== nextRecord.target) {
        /*
          Apply the last object property change that occured in a row.
          ex) If firstName changed 5 times in a row and we undo, then apply only
              the first of the five records. Redo will be the last of the five.
         */
        setObject(record.target, record.key, type === 'undo' ? record.before : record.after);
      }
    });

    return extractedRecords;
  },

  /**
   * Extract the specified number of records from the given stack
   *
   * @method _extractRecords
   * @param  {Array} stack
   * @param  {Number} numRecords Number of records to apply
   * @param  {Object} options
   * @return {Array} Records that were extracted
   * @private
   */
  _extractRecords(stack, numRecords, options = {}) {
    let whitelist = options.on;
    let blacklist = options.excludes;
    let extractedRecords = [];

    for (let i = stack.length - 1; i >= 0 && extractedRecords.length < numRecords; i--) {
      let record = stack.objectAt(i);

      if (isNone(record) ||
        (isArray(whitelist) && !pathInGlobs(record.fullPath, whitelist)) ||
        (isArray(blacklist) && pathInGlobs(record.fullPath, blacklist))) {
        continue;
      }

      extractedRecords.push(record);
    }

    stack.removeObjects(extractedRecords);

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
    let state = this.get('_rootMachineState');
    let redoStack = state.get('redoStack');

    if (!pathInGlobs(record.fullPath, state.get('ignoredProperties'))) {
      state.get('undoStack').pushObject(Object.freeze(record));

      if (!isEmpty(redoStack)) {
        redoStack.setObjects([]);
      }

      if (this._changeInProgress) {
        this._totalChangesInProgress++;
      } else {
        const undoTotal = this.get('_rootMachineState.undoTotal');
        undoTotal.push(1);
      }

      // beginPropertyChanges
      // endPropertyChanges

      // undoTotal.push(this._changeInProgress ? (undoTotal.pop() || 0) + 1 : 1);

    }
  }
});
