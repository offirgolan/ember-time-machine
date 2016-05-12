import Ember from 'ember';
import ArrayRecordKeeper from 'ember-time-machine/proxies/array';
import ObjectRecordKeeper from 'ember-time-machine/proxies/object';

const {
  isArray,
  A: emberArray
} = Ember;

export default function wrapValue(obj, key, value) {
  if(value && value instanceof Ember.Object && !value.__isRecordKeeper__) {
    return ObjectRecordKeeper.create({
      content: value,
      records: obj.get('records'),
      _path: obj.get('_path').concat(key),
      _meta: obj.get('_meta')
    });
  }

  if(value && isArray(value) && !value.__isRecordKeeper__) {
    return ArrayRecordKeeper.create({
      content: emberArray(value),
      records: obj.get('records'),
      _path: obj.get('_path').concat(key),
      _meta: obj.get('_meta')
    });
  }

  return value;
}
