import Ember from 'ember';
import RecordKeeperMixin from 'ember-time-machine/mixins/time-machine';
import Record from 'ember-time-machine/-private/Record';
import wrapValue from 'ember-time-machine/utils/wrap-value';

const {
  isNone
} = Ember;

const ArrayProxy = Ember.ArrayProxy.extend(RecordKeeperMixin, {
  objectAtContent(index) {
    const value = this._super(...arguments);
    return wrapValue(this, index, value);
  },

  replaceContent(startIndex, numRemoved, objects) {
    console.log(...arguments);
    const records = this.get('records');
    let before, after;

    if(isNone(records)) {
      return;
    }

    this._removeRecordsAfterChange();

    if(numRemoved > 0) {
      before = this.slice(startIndex, startIndex + numRemoved);
    } else {
      after = objects;
    }

    records.pushObject(new Record(this.get('_path'), startIndex, before, after, true));
    this.incrementProperty('_meta.currIndex');

    return this._super(...arguments);
  }
});

ArrayProxy.reopenClass({
  __isTimeMachine__: true
});

export default ArrayProxy;
