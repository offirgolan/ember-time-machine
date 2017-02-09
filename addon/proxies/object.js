import Ember from 'ember';
import RecordKeeperMixin from 'ember-time-machine/mixins/time-machine';
import Record from 'ember-time-machine/-private/Record';
import { wrapValue, unwrapValue } from 'ember-time-machine/utils/value';
import { pathInGlobs } from 'ember-time-machine/utils/utils';

const { get } = Ember;

export default Ember.ObjectProxy.extend(RecordKeeperMixin, {
  unknownProperty(key) {
    return wrapValue(this, key, this._super(...arguments));
  },

  setUnknownProperty(key, value) {
    let content = get(this, 'content');
    let state = get(this, '_rootMachineState');
    let path = get(this, '_path');

    if (state && !pathInGlobs(path.concat(key).join('.'), get(state, 'frozenProperties'))) {
      this._addRecord(new Record({
        target: content,
        path,
        key,
        before: get(content, key),
        after: value
      }));

      return this._super(key, unwrapValue(value));
    }

    this.notifyPropertyChange(key);
    return;
  }
});
