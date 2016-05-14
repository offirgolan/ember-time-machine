import Ember from 'ember';

export default Ember.Controller.extend({
  store: Ember.inject.service(),

  actions: {
    addTag() {
      this.get('model.tags').pushObject(this.get('tag'));
      this.set('tag', '');
    },
    removeTag(tag) {
      this.get('model.tags').removeObject(tag);
    },
    addFriend() {
      this.get('model.messages').pushObject(this.get('store').createRecord('message', {
        firstName: 'asdf'
      }));
    },
    removeFriend(friend) {
      this.get('model.dsModel.friends').removeObject(friend);
    },
    undo() {
      this.get('model').undo();
    },

    redo() {
      this.get('model').redo();
    },

    undoAll() {
      this.get('model').undoAll();
    },

    redoAll() {
      this.get('model').redoAll();
    },

    commit() {
      this.get('model').commit();
    }
  }
});
