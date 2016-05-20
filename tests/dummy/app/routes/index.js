import Ember from 'ember';
import TimeMachine from 'ember-time-machine';

export default Ember.Route.extend({
  model() {
    return Ember.RSVP.hash({
      model: this.store.createRecord('user', {
        avatar: 'images/tomster.png',
        username: 'Tomster',
        firstName: 'Tom',
        lastName: 'Hamster'
      }),
      tasks: this.store.findAll('task')
    });
  },

  setupController(controller, models) {
    const { model, tasks } = models;

    model.set('tasks', tasks);
    model.set('settings', this.store.createRecord('setting'));

    controller.set('model', TimeMachine.Object.create({
      content: model,
      ignoredProperties: ['tasks.@each.isDraggingObject', 'tasks.@each.isEditing'],
      frozenProperties: ['username', 'tasks']
    }));
  }
});
