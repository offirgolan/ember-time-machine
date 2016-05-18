import DS from 'ember-data';

const { attr } = DS;

export default DS.Model.extend({
  showTabs: attr('boolean', { defaultValue: true }),
  newTasks: attr('boolean', { defaultValue: true }),
  newOnTop: attr('boolean', { defaultValue: true }),
  sortableCards: attr('boolean', { defaultValue: false })
});
