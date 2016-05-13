import Ember from 'ember';
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
    const path = this.get('_path');
    const meta = this.get('_meta');

    set(this, 'records', isNone(records) ? emberArray() : records);
    set(this, '_path', isNone(path) ? emberArray() : path);
    set(this, '_meta', isNone(meta) ? { currIndex: -1 } : meta);
  },

  undo(numUndos = 1) {
    if(!this.get('canUndo')) {
      return;
    }

    const changes = this._getChanges('undo', this.get('_meta.currIndex'), numUndos);

    this._applyArrayChanges('undo', changes.array);
    this._applyObjectChanges('undo', changes.object);

    this.decrementProperty('_meta.currIndex', changes.total);
  },

  redo(numRedos = 1) {
    if(!this.get('canRedo')) {
      return;
    }

    const changes = this._getChanges('redo', this.get('_meta.currIndex') + 1, numRedos);

    this._applyArrayChanges('redo', changes.array);
    this._applyObjectChanges('redo', changes.object);

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

  _applyObjectChanges(type, changes) {
    const content = this.get('content');

    Object.keys(changes).forEach(path => {
      const record = changes[path];
      setObject(content, record.fullPath, type === 'undo' ? record.before : record.after);
    });
  },

  _applyArrayChanges(type, changes) {
    const content = this.get('content');

    Object.keys(changes).forEach(path => {
      const records = changes[path];
      const array = content.get(path);
      let arrayClone = emberArray(array.slice(0));

      records.forEach(record => {
        if(type === 'undo') {
          this._undoArrayChange(arrayClone, record);
        } else {
          this._redoArrayChange(arrayClone, record);
        }
      });

      array.replace(0, array.get('length'), arrayClone);
    });
  },

  _undoArrayChange(array, record) {
    if(record.type === 'ADD') {
      array.replace(record.key, record.after.length, []);
    } else if(record.type === 'DELETE') {
      array.replace(record.key, 0, record.before);
    }
  },

  _redoArrayChange(array, record) {
    if(record.type === 'ADD') {
      array.replace(record.key, 0, record.after);
    } else if(record.type === 'DELETE') {
      array.replace(record.key, record.before.length, []);
    }
  },

  _getChanges(type, startIndex, numChanges) {
    const records = this.get('records');
    const changes = {
      array: {},
      object: {},
      total: 0
    };

    for(let i = 0; i < numChanges && startIndex > -1 && startIndex < records.length; i++) {
      let record = records.objectAt(startIndex);

      if(isNone(record)) {
        continue;
      }

      if(record.isArray) {
        changes.array[record.pathString] = changes.array[record.pathString] || [];
        changes.array[record.pathString].push(record);
      } else {
        changes.object[record.fullPath] = record;
      }

      startIndex += type === 'undo' ? -1 : 1;
      changes.total++;
    }

    return changes;
  }
});
