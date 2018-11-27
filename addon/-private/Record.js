import { isArray } from '@ember/array';
import { unwrapValue } from 'ember-time-machine/utils/value';

export default class Record {
  constructor({ target, path, key, before, after }) {
    this.target = target;
    this.path = path;
    this.key = key;
    this.before = unwrapValue(before);
    this.after = unwrapValue(after);
    this.isArray = isArray(target) && typeof key === 'number';

    this.pathToKey = path.join('.');
    this.fullPath = path.concat(this.key).join('.');
    this.timestamp = (new Date()).toString();

    if (before !== undefined && after !== undefined) {
      this.type = 'MODIFY';
    } else if (before === undefined) {
      this.type = 'ADD';
    } else {
      this.type = 'DELETE';
    }
  }
}
