export default {
  undoArrayRecord(record = {}) {
    if (record.type === 'ADD') {
      record.target.replace(record.key, record.after.length, []);
    } else if (record.type === 'DELETE') {
      record.target.replace(record.key, 0, record.before);
    }
  },

  redoArrayRecord(record = {}) {
    if (record.type === 'ADD') {
      record.target.replace(record.key, 0, record.after);
    } else if (record.type === 'DELETE') {
      record.target.replace(record.key, record.before.length, []);
    }
  }
};
