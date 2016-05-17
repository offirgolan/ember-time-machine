import { unwrapValue } from 'ember-time-machine/utils/wrap-value';

export default class Record {
  constructor(target, path , key, before, after, isArray = false) {
    this.target = target;
    this.path = path;
    this.key = key;
    this.before = unwrapValue(before);
    this.after = unwrapValue(after);
    this.timestamp = (new Date()).toString();
    this.isArray = isArray;

    if(!isUndefined(before) && !isUndefined(after)) {
      this.type = 'MODIFY';
    } else if(isUndefined(before)) {
      this.type = 'ADD';
    } else {
      this.type = 'DELETE';
    }
  }

  get pathToKey() {
    return this.path.join('.');
  }

  get fullPath() {
    return this.path.concat(this.key).join('.');
  }
}

function isUndefined(value) {
  return value === undefined;
}
