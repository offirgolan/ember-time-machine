import Ember from 'ember';

export default Ember.Controller.extend({
  actions: {
    addTag() {
      this.get('model.tags').pushObject(this.get('tag'));
      this.set('tag', '');
    },
    removeTag(tag) {
      this.get('model.tags').removeObject(tag);
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
    }
  }
});
