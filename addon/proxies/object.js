import Ember from 'ember';
import RecordKeeperMixin from 'ember-time-machine/mixins/time-machine';
import Record from 'ember-time-machine/-private/Record';
import wrapValue from '../utils/wrap-value';

const {
  get,
  isNone
} = Ember;

const ObjectProxy = Ember.ObjectProxy.extend(RecordKeeperMixin, {
  unknownProperty(key) {
    return wrapValue(this, key, this._super(...arguments));
  },

  setUnknownProperty(key, value) {
    const records = this.get('records');
    const content = this.get('content');

    if(!isNone(records)) {
      this._removeRecordsAfterChange();
      this._addRecord(new Record(this.get('_path'), key, get(content, key), value));
    }
    
    return this._super(...arguments);
  }
});

ObjectProxy.reopenClass({
  __isTimeMachine__: true
});

export default ObjectProxy;
