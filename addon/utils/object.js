import Ember from 'ember';

const {
  get,
  set,
  isNone,
  isArray,
  isEmpty
} = Ember;

export function getObject(obj, key) {
  const path = key.toString().split('.');
  let o = obj;

  for(let i = 0; i < path.length; i++) {
    const k = path[i];

    if(isNone(o)) {
      break;
    }

    if(isArray(o) && !isEmpty(k) && !isNaN(k)) {
      o = o.objectAt(parseInt(k));
    } else {
      o = get(o, k);
    }
  }

  return o;
}

export function setObject(obj, key, value) {
  let path = key.split('.');
  let property = path[path.length - 1];

  path = path.slice(0, path.length - 1);
  let o = getObject(obj, path.join('.'));

  if(o) {
    return set(o, property, value);
  }
}
