import Ember from 'ember';
import TimeMachine from 'ember-time-machine';

const {
  isArray,
  A: emberArray
} = Ember;

export default function wrapValue(obj, key, value) {
  if(value && isArray(value) && !value.__isTimeMachine__) {
    return TimeMachine.Array.create({
      content: emberArray(value),
      records: obj.get('records'),
      ignoredProperties: obj.get('ignoredProperties'),
      _path: obj.get('_path').concat(key),
      _meta: obj.get('_meta')
    });
  }

  if(value && value instanceof Ember.Object && !value.__isTimeMachine__) {
    return TimeMachine.Object.create({
      content: value,
      records: obj.get('records'),
      ignoredProperties: obj.get('ignoredProperties'),
      _path: obj.get('_path').concat(key),
      _meta: obj.get('_meta')
    });
  }

  return value;
}
