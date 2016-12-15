import Ember from 'ember';
import TimeMachine from 'ember-time-machine';

const {
  get,
  typeOf,
  isArray
} = Ember;

export function wrapValue(obj, key, value) {
  let state = obj.get('_rootMachineState');
  let availableMachines = state.get('availableMachines');
  let fullPath = obj.get('_path').concat(key);
  let Machine, machine;

  if (availableMachines && availableMachines.has(value)) {
    return availableMachines.get(value);
  }

  if (shouldWrapValue(obj, key, value)) {
    if (isArray(value)) {
      Machine = TimeMachine.Array;
    } else if (typeof value === 'object') {
      Machine = TimeMachine.Object;
    }

    if (Machine) {
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
  if (value && get(value, 'isTimeMachine')) {
    return unwrapValue(get(value, 'content'));
  }

  if (value && isArray(value)) {
    return value.map((v) => get(v, 'isTimeMachine') ? unwrapValue(get(v, 'content')) : v);
  }

  return value;
}

function shouldWrapValue(obj, key, value) {
  let state = obj.get('_rootMachineState');
  let maxDepth = state.get('maxDepth');
  let fullPath = obj.get('_path').concat(key);
  let valueType = typeOf(value);

  return (valueType === 'object' || valueType === 'instance' || valueType === 'array') &&
         (maxDepth < 0 || fullPath.length <= maxDepth) &&
         !get(value, 'isTimeMachine') &&
         state.shouldWrapValue(value, obj, key);
}
