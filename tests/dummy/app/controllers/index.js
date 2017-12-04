import Ember from 'ember';

const {
  isEmpty
} = Ember;

export default Ember.Controller.extend({
  store: Ember.inject.service(),

  newTask: '',
  tasksArray: 'tasks',

  actions: {
    multiChange() {
      let task = this.get('model.tasks.firstObject');
      task.startTimeMachine();
      task.setProperties({
        title: new Date().toString(),
        isCompleted: true
      });
      task.stopTimeMachine();
    },

    addTask() {
      let title = this.get('newTask');

      if (isEmpty(title)) {
        return;
      }

      let newTask = this.get('store').createRecord('task', { title });

      if (this.get('model.settings.newOnTop')) {
        this.get('model.tasks').insertAt(0, newTask);
      } else {
        this.get('model.tasks').pushObject(newTask);
      }

      this.set('newTask', '');
    },
    removeTask(task) {
      this.get('model.tasks').removeObject(task);
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
