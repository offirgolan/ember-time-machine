import { filterBy } from '@ember/object/computed';
import { computed } from '@ember/object';
import DS from 'ember-data';

const { attr } = DS;

export default DS.Model.extend({
  firstName: attr('string'),
  lastName: attr('string'),
  avatar: attr('string'),

  username: computed('firstName', function() {
    return `${this.get('firstName')}ster`;
  }).readOnly(),

  settings: DS.belongsTo('setting'),
  tasks: DS.hasMany('task'),

  activeTasks: filterBy('tasks', 'isCompleted', false),
  completedTasks: filterBy('tasks', 'isCompleted', true),

  displayName: computed('firstName', 'lastName', 'username', function() {
    return `${this.get('username')} (${this.get('firstName')} ${this.get('lastName')})`;
  })
});
