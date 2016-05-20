import Utils from 'ember-time-machine/utils/record';
import { module, test } from 'qunit';

module('Unit | Utility | record');

test('pathInArray - simple', function(assert) {
  assert.equal(Utils.pathInArray(), false);
  assert.equal(Utils.pathInArray([], 'foo'), false);
  assert.equal(Utils.pathInArray(['foo'], 'foo'), true);
  assert.equal(Utils.pathInArray(['foo.bar.baz'], 'foo.bar.baz'), true);
});

test('pathInArray - @each', function(assert) {
  assert.equal(Utils.pathInArray(['a.b.@each.c'], 'a.b.2.c'), true);
  assert.equal(Utils.pathInArray(['a.b.@each.c'], 'a.b.1.b'), false);
  assert.equal(Utils.pathInArray(['a.b.@each.c'], 'a.b.d.c'), false);

  assert.equal(Utils.pathInArray(['@each.a.b'], '0.a.b'), true);
  assert.equal(Utils.pathInArray(['@each.a.@each.b'], '0.a.1.b'), true);
});
