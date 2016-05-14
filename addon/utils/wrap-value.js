import Ember from 'ember';
import TimeMachine from 'ember-time-machine';

const {
  get,
  isArray,
  isNone,
  A: emberArray
} = Ember;

export function wrapValue(obj, key, value) {
  const availableMachines = obj.get('_meta').availableMachines;
  const fullPath = obj.get('_path').concat(key).join('.');


  if(!isNone(availableMachines[fullPath])) {
    return availableMachines[fullPath];
  }

  if(value && isArray(value) && !get(value, '__isTimeMachine__')) {
    const machine = TimeMachine.Array.create({
      content: emberArray(value),
      records: obj.get('records'),
      ignoredProperties: obj.get('ignoredProperties'),
      _path: obj.get('_path').concat(key),
      _meta: obj.get('_meta')
    });

    availableMachines[fullPath] = machine;
    return machine;
  }

  if(value && value instanceof Ember.Object && !get(value, '__isTimeMachine__')) {
    const machine = TimeMachine.Object.create({
      content: value,
      records: obj.get('records'),
      ignoredProperties: obj.get('ignoredProperties'),
      _path: obj.get('_path').concat(key),
      _meta: obj.get('_meta')
    });

    availableMachines[fullPath] = machine;
    return machine;
  }

  return value;
}

export function unwrapValue(value) {
  if(value && isArray(value)) {
    return value.map(v => get(v, '__isTimeMachine__') ? unwrapValue(get(v, 'content')) : v);
  }

  if(value && value instanceof Ember.Object && get(value, '__isTimeMachine__')) {
    return unwrapValue(get(value, 'content'));
  }

  return value;
}
