import Ember from 'ember';
import User from '../models/user';

export default Ember.Route.extend({
  model() {
    return User.create(Ember.getOwner(this).ownerInjection(), {
      content: Ember.Object.create({
        friend: Ember.Object.create({
          friend: Ember.Object.create()
        }),
        tags: Ember.A(['foo'])
      })
    });
  }
});
