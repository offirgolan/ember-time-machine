export default {
  pathInArray(array = [], path = '') {

    for(let i = 0; i < array.length; i++) {
      let regex = ('.' + array[i]).replace( new RegExp( /\.\*/, 'g' ), '\\.(\\w+)' ).replace( new RegExp( /\.@each/, 'g' ), '\\.(\\d+)' );

      console.log(regex, path);
      if(('.' + path).match(regex)) {
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
