import Ember from 'ember';
import RecordKeeperMixin from 'ember-time-machine/mixins/time-machine';
import Record from 'ember-time-machine/-private/Record';
import RecordUtils from 'ember-time-machine/utils/record';
import { wrapValue, unwrapValue } from 'ember-time-machine/utils/value';

export default Ember.ObjectProxy.extend(RecordKeeperMixin, {
  unknownProperty(key) {
    return wrapValue(this, key, this._super(...arguments));
  },

  setUnknownProperty(key, value) {
    const content = this.get('content');
    const state = this.get('_rootMachineState');
    const path = this.get('_path');

    if(state && !RecordUtils.pathInArray(state.get('frozenProperties'), path.concat(key).join('.'))) {
      this._addRecord(new Record(content, path, key, content.get(key), value, false));
      return this._super(key, unwrapValue(value));
    }

    this.notifyPropertyChange(key);
    return;
  }
});
