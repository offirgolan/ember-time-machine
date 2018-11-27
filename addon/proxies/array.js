import ArrayProxy from '@ember/array/proxy';
import RecordKeeperMixin from 'ember-time-machine/mixins/time-machine';
import Record from 'ember-time-machine/-private/Record';
import { wrapValue, unwrapValue } from 'ember-time-machine/utils/value';
import { pathInGlobs } from 'ember-time-machine/utils/utils';

export default ArrayProxy.extend(RecordKeeperMixin, {
  objectAtContent(index) {
    return wrapValue(this, index, this._super(...arguments));
  },

  replaceContent(startIndex, numRemoved, objects) {
    let state = this.get('_rootMachineState');
    let path = this.get('_path');
    let content = this.get('content');
    let before, after;

    if (state && !pathInGlobs(path.join('.'), state.get('frozenProperties'))) {
      if (numRemoved > 0) {
        before = this.slice(startIndex, startIndex + numRemoved);
      } else {
        after = objects;
      }

      this._addRecord(new Record({
        target: content,
        path,
        key: startIndex,
        before,
        after
      }));

      return this._super(startIndex, numRemoved, unwrapValue(objects));
    }
  }
});
