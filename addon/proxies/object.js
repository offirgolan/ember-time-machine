import Ember from 'ember';
import RecordKeeperMixin from 'ember-time-machine/mixins/time-machine';
import Record from 'ember-time-machine/-private/Record';
import { wrapValue, unwrapValue } from 'ember-time-machine/utils/value';
import { pathInGlobs } from 'ember-time-machine/utils/utils';

export default Ember.ObjectProxy.extend(RecordKeeperMixin, {
  unknownProperty(key) {
    return wrapValue(this, key, this._super(...arguments));
  },

  setUnknownProperty(key, value) {
    let content = this.get('content');
    let state = this.get('_rootMachineState');
    let path = this.get('_path');

    if (state && !pathInGlobs(path.concat(key).join('.'), state.get('frozenProperties'))) {
      this._addRecord(new Record({
        target: content,
        path,
        key,
        before: content.get(key),
        after: value
      }));

      return this._super(key, unwrapValue(value));
    }

    this.notifyPropertyChange(key);
    return;
  }
});
