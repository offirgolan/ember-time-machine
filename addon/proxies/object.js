import Ember from 'ember';
import RecordKeeperMixin from 'ember-time-machine/mixins/time-machine';
import Record from 'ember-time-machine/-private/Record';
import { wrapValue, unwrapValue } from 'ember-time-machine/utils/wrap-value';

export default Ember.ObjectProxy.extend(RecordKeeperMixin, {
  unknownProperty(key) {
    return wrapValue(this, key, this._super(...arguments));
  },

  setUnknownProperty(key, value) {
    const content = this.get('content');

    this._addRecord(new Record(content, this.get('_path'), key, content.get(key), value, false));

    return this._super(key, unwrapValue(value));
  }
});
