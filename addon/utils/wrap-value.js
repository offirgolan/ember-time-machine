import Ember from 'ember';
import TimeMachine from 'ember-time-machine';
import { getObject, setObject } from 'ember-time-machine/utils/object';

const {
  get,
  isArray,
  isNone
} = Ember;

function contentAlias(path) {
  return Ember.computed(`_meta.rootMachine.content.${path}`, {
    get() {
      return getObject(this.get('_meta.rootMachine.content'), path);
    },
    set(key, value) {
      setObject(this.get('_meta.rootMachine.content'), path, value);
      return value;
    }
  });
}

export function wrapValue(obj, key, value) {
  const availableMachines = obj.get('_meta').availableMachines;
  const fullPath = obj.get('_path').concat(key).join('.');

  if(!isNone(availableMachines[fullPath])) {
    return availableMachines[fullPath];
  }

  if(value && isArray(value) && !get(value, '__isTimeMachine__')) {
    const machine = TimeMachine.Array.extend({
      content: contentAlias(fullPath)
    }).create({
      records: obj.get('records'),
      ignoredProperties: obj.get('ignoredProperties'),
      _path: obj.get('_path').concat(key),
      _meta: obj.get('_meta')
    });

    availableMachines[fullPath] = machine;
    return machine;
  }

  if(value && value instanceof Ember.Object && !get(value, '__isTimeMachine__')) {
    const machine = TimeMachine.Object.extend({
      content: contentAlias(fullPath)
    }).create({
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

  if(value && (value instanceof Ember.ObjectProxy || get(value, '__isTimeMachine__'))) {
    return unwrapValue(get(value, 'content'));
  }

  return value;
}
