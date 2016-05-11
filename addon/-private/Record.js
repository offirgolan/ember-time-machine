export default class Record {
  constructor(key, before, after) {
    this.key = key;
    this.before = before;
    this.after = after;
    this.timestamp = (new Date()).toString();

    if(!isUndefined(before) && !isUndefined(after)) {
      this.type = 'MODIFY';
    } else if(isUndefined(before)) {
      this.type = 'ADD';
    } else {
      this.type = 'DELETE';
    }
  }
}

function isUndefined(value) {
  return value === undefined;
}
