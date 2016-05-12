import Ember from 'ember';
import RecordKeeperMixin from 'ember-time-machine/mixins/time-machine';
import Record from 'ember-time-machine/-private/Record';
import wrapValue from '../utils/wrap-value';

const {
  get,
  isNone
} = Ember;

export default Ember.ObjectProxy.extend(RecordKeeperMixin, {
  unknownProperty(key) {
    const value = this._super(...arguments);
    return wrapValue(this, key, value);
  },

  setUnknownProperty(key, value) {
    const records = this.get('records');
    const content = this.get('content');

    if(isNone(records)) {
      return;
    }

    this._removeRecordsAfterChange();

    records.pushObject(new Record(this.get('_path'), key, get(content, key), value));
    this.incrementProperty('_meta.currIndex');

    return this._super(...arguments);
  }
});
