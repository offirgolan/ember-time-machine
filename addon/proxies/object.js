import Ember from 'ember';
import RecordKeeperMixin from '../mixin/record-keeper';

const ObjectRecordKeeper = Ember.ObjectProxy.extend(RecordKeeperMixin, {

});

export default ObjectRecordKeeper;
