import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { isEmpty } from '@ember/utils';

export default Controller.extend({
  store: service(),

  newTask: '',
  tasksArray: 'tasks',

  actions: {
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
