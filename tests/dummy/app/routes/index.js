import Ember from 'ember';
import TimeMachine from 'ember-time-machine';

export default Ember.Route.extend({
  model() {
    return this.store.findRecord('user', 1);
  },

  setupController(controller, model) {
    model.set('settings', this.store.createRecord('setting'));

    controller.set('model', TimeMachine.Object.create({
      content: model,
      ignoredProperties: ['tasks.@each.isDraggingObject', 'tasks.@each.isEditing']
    }));
  }
});
