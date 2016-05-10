import Ember from 'ember';

export default Ember.Controller.extend({
  actions: {
    undo(num = 1) {
      this.get('model').undo(num);
    },

    undoAll() {
      this.get('model').undoAll();
    }
  }
});
