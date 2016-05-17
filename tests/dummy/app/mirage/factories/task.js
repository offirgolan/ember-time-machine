/*
  This is an example factory definition.

  Create more files in this directory to define additional factories.
*/
import Mirage, { faker } from 'ember-cli-mirage';

faker.locale = "en_US";

export default Mirage.Factory.extend({
  text: faker.lorem.sentence,
  dueDate: faker.date.future,
  isCompleted: false
});
