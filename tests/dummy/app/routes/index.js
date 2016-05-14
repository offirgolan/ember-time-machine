import Ember from 'ember';
import TimeMachine from 'ember-time-machine';

export default Ember.Route.extend({
  model() {
    return Ember.RSVP.hash({
      model: this.store.findRecord('user', 1),
      users: this.store.findAll('user'),
      messages: this.store.findAll('message')
    });
  },

  setupController(controller, models) {
    const { model, messages, users } = models;

    model.set('messages', messages);

    controller.setProperties({
      model: TimeMachine.Object.create({ content: model, ignoredProperties: ['isDraggingObject', 'messages.@each.isDraggingObject'] }),
      users
    });
  }
});
