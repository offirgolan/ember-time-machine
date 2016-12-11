import Ember from 'ember';

const {
  get,
  set,
  isNone,
  isArray,
  isEmpty,
  canInvoke
} = Ember;

export function getObject(obj, key) {
  let path = key.toString().split('.');
  let o = obj;

  for (let i = 0; i < path.length; i++) {
    let k = path[i];

    if (isNone(o)) {
      break;
    }

    if (isArray(o) && !isEmpty(k) && !isNaN(k)) {
      let idx = parseInt(k, 10);
      o = canInvoke(o, 'objectAt') ? o.objectAt(idx) : o[idx];
    } else {
      o = isEmpty(k) ? o : get(o, k);
    }
  }

  return o;
}

export function setObject(obj, key, value) {
  let path = key.split('.');
  let property = path[path.length - 1];

  path = path.slice(0, path.length - 1);
  let o = getObject(obj, path.join('.'));

  if (o) {
    return set(o, property, value);
  }
}
