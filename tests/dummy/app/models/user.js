import Ember from 'ember';
import DS from 'ember-data';

const { attr } = DS;
const { computed } = Ember;

export default DS.Model.extend({
  firstName: attr('string'),
  lastName: attr('string'),
  avatar: attr('string'),

  username: computed('firstName', function() {
    return `${this.get('firstName')}ster`;
  }).readOnly(),

  settings: DS.belongsTo('setting'),
  tasks: DS.hasMany('task'),

  activeTasks: computed.filterBy('tasks', 'isCompleted', false),
  completedTasks: computed.filterBy('tasks', 'isCompleted', true),

  displayName: computed('firstName', 'lastName', 'username', function() {
    return `${this.get('username')} (${this.get('firstName')} ${this.get('lastName')})`;
  })
});
