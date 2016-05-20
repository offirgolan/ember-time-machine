export default {
  pathInArray(array = [], path = '') {
    for(let i = 0; i < array.length; i++) {
      // object.array.@each.array.@each.prop === object.array.1.array.2.prop
      if(array[i] === path.replace(new RegExp(/\d+\./, 'g'), '@each.')) {
        return true;
      }
    }

    return false;
  },

  undoArrayRecord(record = {}) {
    if(record.type === 'ADD') {
      record.target.replace(record.key, record.after.length, []);
    } else if(record.type === 'DELETE') {
      record.target.replace(record.key, 0, record.before);
    }
  },

  redoArrayRecord(record = {}) {
    if(record.type === 'ADD') {
      record.target.replace(record.key, 0, record.after);
    } else if(record.type === 'DELETE') {
      record.target.replace(record.key, record.before.length, []);
    }
  }
};
