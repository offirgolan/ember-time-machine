import Ember from 'ember';
import RecordKeeperMixin from '../mixin/record-keeper';

const ArrayRecordKeeper = Ember.ArrayProxy.extend(RecordKeeperMixin, {

});

export default ArrayRecordKeeper;
