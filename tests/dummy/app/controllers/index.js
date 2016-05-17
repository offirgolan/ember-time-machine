import Ember from 'ember';

const {
  computed
} = Ember;

export default Ember.Controller.extend({
  store: Ember.inject.service(),

  newTask: '',
  filter: 'all',

  tasks: computed('filter', function() {
    const filter = this.get('filter');
    if(filter === 'all') {
      return this.get('model.tasks');
    } else if(filter === 'active') {
      return this.get('model.activeTasks');
    } else {
      return this.get('model.completedTasks');
    }
  }),

  actions: {
    addTask() {
      const newTask = this.get('store').createRecord('task', { text: this.get('newTask') });
      if(this.get('model.settings.newOnTop')) {
        this.get('model.tasks').insertAt(0, newTask);
      } else {
        this.get('model.tasks').pushObject(newTask);
      }
      this.set('newTask', '');
    },
    removeTask(friend) {
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
