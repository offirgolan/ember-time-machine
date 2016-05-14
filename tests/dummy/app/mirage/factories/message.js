/*
  This is an example factory definition.

  Create more files in this directory to define additional factories.
*/
import Mirage, { faker } from 'ember-cli-mirage';

faker.locale = "en_US";

export default Mirage.Factory.extend({
  firstName: faker.name.firstName,
  lastName: faker.name.firstName,
  avatar: faker.internet.avatar,
  title: faker.lorem.sentence,
  body: faker.lorem.paragraph
});
