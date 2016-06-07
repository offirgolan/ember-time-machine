import Ember from 'ember';
import TimeMachine from 'ember-time-machine';

const {
  get,
  isArray
} = Ember;

export function wrapValue(obj, key, value) {
  const state = obj.get('_rootMachineState');
  const availableMachines = state.get('availableMachines');
  const fullPath = obj.get('_path').concat(key);
  const maxDepth = state.get('maxDepth');
  const shouldTrack = maxDepth < 0 || fullPath.length <= maxDepth;
  let Machine, machine;

  if(availableMachines && availableMachines.has(value)) {
    return availableMachines.get(value);
  }

  if(value && shouldTrack && !get(value, 'isTimeMachine')) {
    if(isArray(value)) {
      Machine = TimeMachine.Array;
    } else if(typeof value === 'object') {
      Machine = TimeMachine.Object;
    }

    if(Machine) {
      machine = Machine.create({
        content: value,
        _path: fullPath,
        _rootMachine: obj.get('_rootMachine')
      });

      availableMachines.set(value, machine);
      return machine;
    }
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
