import Ember from 'ember';
import RecordKeeperMixin from 'ember-time-machine/mixins/time-machine';
import Record from 'ember-time-machine/-private/Record';
import { wrapValue, unwrapValue } from 'ember-time-machine/utils/value';
import { pathInGlobs } from 'ember-time-machine/utils/utils';

export default Ember.ArrayProxy.extend(RecordKeeperMixin, {
  objectAtContent(index) {
    return wrapValue(this, index, this._super(...arguments));
  },

  replaceContent(startIndex, numRemoved, objects) {
    const state = this.get('_rootMachineState');
    const path = this.get('_path');
    let before, after;

    if(state && !pathInGlobs(path.join('.'), state.get('frozenProperties'))) {
      if(numRemoved > 0) {
        before = this.slice(startIndex, startIndex + numRemoved);
      } else {
        after = objects;
      }

      this._addRecord(new Record(this.get('content'), path, startIndex, before, after, true));

      return this._super(startIndex, numRemoved, unwrapValue(objects));
    }
  }
});
