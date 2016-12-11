import Ember from 'ember';
import { getObject, setObject } from 'ember-time-machine/utils/object';
import { module, test } from 'qunit';

module('Unit | Utility | object');

const {
  A: emberArray
} = Ember;

let root = {
  a: {
    b: {
      c: {
        d: 1
      }
    },
    array: [
      {
        one: 1
      }, {
        two: 2
      }
    ]
  }
};

let eArray = {
  array: emberArray([
    {
      one: 1
    }, {
      two: 2
    }
  ])
};

let arrayProxy = {
  proxy: Ember.ArrayProxy.create({
    content: eArray.array
  })
};

test('getObject', function(assert) {
  assert.deepEqual(getObject(root, 'a.b.c'), { d: 1 });
  assert.equal(getObject(root, 'a.array.0.one'), 1);
  assert.notOk(getObject(root, 'a.array.5.five'));
  assert.notOk(getObject(root, 'a.d'));
  assert.notOk(getObject(root, 'foo.bar'));
});

test('getObject - ember array', function(assert) {
  assert.equal(getObject(eArray, 'array.0.one'), 1);
  assert.equal(getObject(eArray, 'array.1.two'), 2);
  assert.notOk(getObject(eArray, 'array.10.ten'));
});

test('getObject - ember array proxy', function(assert) {
  assert.equal(getObject(arrayProxy, 'proxy.0.one'), 1);
  assert.equal(getObject(arrayProxy, 'proxy.1.two'), 2);
  assert.notOk(getObject(arrayProxy, 'proxy.10.ten'));
});

test('setObject', function(assert) {
  setObject(root, 'a.foo', 'bar');
  assert.equal(getObject(root, 'a.foo'), 'bar');

  setObject(eArray, 'array.0.foo', 'bar');
  assert.equal(getObject(eArray, 'array.0.foo'), 'bar');

  setObject(arrayProxy, 'proxy.0.foo', 'bar');
  assert.equal(getObject(arrayProxy, 'proxy.0.foo'), 'bar');
});
