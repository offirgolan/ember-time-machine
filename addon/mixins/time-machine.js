import Ember from 'ember';

const {
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

  undo(numUndos = 1) {
    const records = this.get('records');
    const content = this.get('content');
    let currIndex = this.get('_meta.currIndex');
    let recordsToApply = {};
    let arrayRecords = {};

    if(!this.get('canUndo')) {
      return;
    }

    for(let i = 0; i < numUndos && currIndex > -1; i++) {
      let record = records.objectAt(currIndex);

      if(isNone(record)) {
        continue;
      }

      if(record.isArray) {
        arrayRecords[record.pathString] = arrayRecords[record.pathString] || [];
        arrayRecords[record.pathString].push(record);
      } else {
        let change = {};
        change[record.fullPath] = record.before;
        assign(recordsToApply, change);
      }

      currIndex--;
    }

    Object.keys(arrayRecords).forEach(path => {
      const records = arrayRecords[path];
      const array = content.get(path);
      let arrayClone = emberArray(array.slice(0));

      records.forEach(record => {
        if(record.type === 'ADD') {
          arrayClone.replace(record.key, record.after.length, []);
        } else if(record.type === 'DELETE') {
          arrayClone.replace(record.key, 0, record.before);
        }
      });

      array.replace(0, array.get('length'), arrayClone);
    });

    content.setProperties(recordsToApply);
    this.set('_meta.currIndex', currIndex);
  },

  redo(numRedos = 1) {
    const records = this.get('records');
    const content = this.get('content');
    let currIndex = this.get('_meta.currIndex');
    let recordsToApply = {};
    let arrayRecords = {};

    if(!this.get('canRedo')) {
      return;
    }

    for(let i = 0; i < numRedos && currIndex < records.length; i++) {
      let record = records.objectAt(currIndex + 1);

      if(isNone(record)) {
        continue;
      }

      if(record.isArray) {
        arrayRecords[record.pathString] = arrayRecords[record.pathString] || [];
        arrayRecords[record.pathString].push(record);
      } else {
        let change = {};
        change[record.fullPath] = record.after;
        assign(recordsToApply, change);
      }

      currIndex++;
    }

    Object.keys(arrayRecords).forEach(path => {
      const records = arrayRecords[path];
      const array = content.get(path);
      let arrayClone = emberArray(array.slice(0));

      records.forEach(record => {
        if(record.type === 'ADD') {
          arrayClone.replace(record.key, 0, record.after);
        } else if(record.type === 'DELETE') {
          arrayClone.replace(record.key, record.before.length, []);
        }
      });

      array.replace(0, array.get('length'), arrayClone);
    });

    content.setProperties(recordsToApply);
    this.set('_meta.currIndex', currIndex);
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
  }
});
