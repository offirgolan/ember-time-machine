import Ember from 'ember';
import TimeMachine from 'ember-time-machine';

export default Ember.Route.extend({
  model() {
    return TimeMachine.Object.create(Ember.getOwner(this).ownerInjection(), {
      content: Ember.Object.create({
        friend: Ember.Object.create({
          friend: Ember.Object.create()
        }),
        tags: Ember.A(['foo']),
        dsModel: this.store.createRecord('user', {
          friends: [
            this.store.createRecord('user')
          ]
        })
      })
    });
  }
});
