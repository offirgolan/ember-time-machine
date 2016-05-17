import Ember from 'ember';
import TimeMachine from 'ember-time-machine';

const {
  get,
  isArray,
  isNone
} = Ember;

export function wrapValue(obj, key, value) {
  const availableMachines = obj.get('_meta').availableMachines;
  const guid = Ember.guidFor(value);
  let machine;

  if(!isNone(availableMachines[guid])) {
    return availableMachines[guid];
  }

  if(value && isArray(value) && !get(value, '__isTimeMachine__')) {
    machine = TimeMachine.Array.create({
      content: value,
      records: obj.get('records'),
      ignoredProperties: obj.get('ignoredProperties'),
      _path: obj.get('_path').concat(key),
      _meta: obj.get('_meta')
    });

    availableMachines[guid] = machine;
    return machine;
  }

  if(value && value instanceof Ember.Object && !get(value, '__isTimeMachine__')) {
    machine = TimeMachine.Object.create({
      content: value,
      records: obj.get('records'),
      ignoredProperties: obj.get('ignoredProperties'),
      _path: obj.get('_path').concat(key),
      _meta: obj.get('_meta')
    });

    availableMachines[guid] = machine;
    return machine;
  }

  return value;
}

export function unwrapValue(value) {
  if(value && isArray(value)) {
    return value.map(v => get(v, '__isTimeMachine__') ? unwrapValue(get(v, 'content')) : v);
  }

  if(value && (value instanceof Ember.ObjectProxy || get(value, '__isTimeMachine__'))) {
    return unwrapValue(get(value, 'content'));
  }

  return value;
}
