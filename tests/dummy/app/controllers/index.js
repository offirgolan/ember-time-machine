import Ember from 'ember';

export default Ember.Controller.extend({
  actions: {
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
