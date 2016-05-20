import Ember from 'ember';
import TimeMachine from 'ember-time-machine';

const {
  get,
  isArray
} = Ember;

export function wrapValue(obj, key, value) {
  const state = obj.get('_rootMachineState');
  const availableMachines = state.availableMachines;
  let machine;

  if(availableMachines && availableMachines.has(value)) {
    return availableMachines.get(value);
  }

  if(value && isArray(value) && !get(value, 'isTimeMachine')) {
    machine = TimeMachine.Array.create({
      content: value,
      _path: obj.get('_path').concat(key),
      _rootMachine: obj.get('_rootMachine')
    });

    availableMachines.set(value, machine);
    return machine;
  }

  if(value && value instanceof Ember.Object && !get(value, 'isTimeMachine')) {
    machine = TimeMachine.Object.create({
      content: value,
      _path: obj.get('_path').concat(key),
      _rootMachine: obj.get('_rootMachine')
    });

    availableMachines.set(value, machine);
    return machine;
  }

  return value;
}

export function unwrapValue(value) {
  if(value && isArray(value)) {
    return value.map(v => get(v, 'isTimeMachine') ? unwrapValue(get(v, 'content')) : v);
  }

  if(value && (value instanceof Ember.ObjectProxy || get(value, 'isTimeMachine'))) {
    return unwrapValue(get(value, 'content'));
  }

  return value;
}
