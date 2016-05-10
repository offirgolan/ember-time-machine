import Ember from 'ember';
import SnapshotMixin from 'ember-snapshot/mixins/snapshot';
import { module, test } from 'qunit';

module('Unit | Mixin | snapshot');

// Replace this with your real tests.
test('it works', function(assert) {
  let SnapshotObject = Ember.Object.extend(SnapshotMixin);
  let subject = SnapshotObject.create();
  assert.ok(subject);
});
