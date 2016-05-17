import Ember from 'ember';
import DS from 'ember-data';

const { attr } = DS;
const { computed } = Ember;

export default DS.Model.extend({
  firstName: attr('string'),
  lastName: attr('string'),
  company: attr('string'),
  address: attr('string'),
  country: attr('string'),
  state: attr('string'),
  email: attr('string'),
  username: attr('string'),
  avatar: attr('string'),
  bio: attr('string'),

  settings: DS.belongsTo('setting'),
  tasks: DS.hasMany('task'),

  activeTasks: computed.filterBy('tasks', 'isCompleted', false),
  completedTasks: computed.filterBy('tasks', 'isCompleted', true)
});
