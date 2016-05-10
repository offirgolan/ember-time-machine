// import Ember from 'ember';

// const assign = Ember.assign || Ember.merge;

export default class Snapshot {
  constructor(key, before, after) {
    this.key = key;
    this.beforeValue = before;
    this.afterValue = after;

    this.before = {};
    this.before[key] = before;

    this.after = {};
    this.after[key] = after;
  }
}
