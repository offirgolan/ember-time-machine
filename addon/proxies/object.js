import ObjectProxy from '@ember/object/proxy';
import { get } from '@ember/object';
import RecordKeeperMixin from 'ember-time-machine/mixins/time-machine';
import Record from 'ember-time-machine/-private/Record';
import { wrapValue, unwrapValue } from 'ember-time-machine/utils/value';
import { pathInGlobs } from 'ember-time-machine/utils/utils';

export default ObjectProxy.extend(RecordKeeperMixin, {
  unknownProperty(key) {
    return wrapValue(this, key, this._super(...arguments));
  },

  setUnknownProperty(key, value) {
    let content = get(this, 'content');
    let state = get(this, '_rootMachineState');
    let path = get(this, '_path');

    if (state && !pathInGlobs(path.concat(key).join('.'), get(state, 'frozenProperties'))) {
      let before = get(content, key);
      let after = value;

      // this will ensure that we add to the undo stack only if the value has changed
      // unfortunately, for the cases when the set value is not a primitive we will not be able to detect deep equality
      // as we use `===` operator which will compare objects by references
      // https://github.com/emberjs/ember.js/issues/5626
      if (after !== before) {
        this._addRecord(new Record({
          target: content,
          path,
          key,
          before: get(content, key),
          after: value
        }));

        return this._super(key, unwrapValue(value));
      }
    }

    this.notifyPropertyChange(key);
    return;
  }
});
