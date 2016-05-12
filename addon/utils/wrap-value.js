import Ember from 'ember';
import ArrayRecordKeeper from 'ember-record-keeper/proxies/array';
import ObjectRecordKeeper from 'ember-record-keeper/proxies/object';

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
