import { pathInGlobs } from 'ember-time-machine/utils/utils';
import { module, test } from 'qunit';

module('Unit | Utility | record');

test('pathInGlobs - simple', function(assert) {
  assert.equal(pathInGlobs(), false);
  assert.equal(pathInGlobs('foo', []), false);
  assert.equal(pathInGlobs('foo', ['foo']), true);
  assert.equal(pathInGlobs('foo.bar.baz', ['foo.bar.baz']), true);
});

test('pathInGlobs - each', function(assert) {
  assert.equal(pathInGlobs('a.b.2.c', ['a.b.@each.c']), true);
  assert.equal(pathInGlobs('a.b.1.b', ['a.b.@each.c']), false);
  assert.equal(pathInGlobs('a.b.d.c', ['a.b.@each.c']), false);

  assert.equal(pathInGlobs('0.a.b', ['@each.a.b']), true);
  assert.equal(pathInGlobs('0.a.1.b', ['@each.a.@each.b']), true);
});

test('pathInGlobs - wildcards', function(assert) {
  assert.equal(pathInGlobs('a.b.d.c', ['a.*.*.c']), true);
  assert.equal(pathInGlobs('a.b.d.c', ['a.b.*.c']), true);
  assert.equal(pathInGlobs('a.b.d.c', ['a.b.d.*']), true);
  assert.equal(pathInGlobs('a.b._d.c', ['a.b.*.c']), true);
  assert.equal(pathInGlobs('a.b.d.a', ['a.*.d.c']), false);

  assert.equal(pathInGlobs('z.b.d', ['*.b.d']), true);
  assert.equal(pathInGlobs('z.a.c.b', ['*.a.*.b']), true);
});
