import BaseSerializer from './application';

export default BaseSerializer.extend({
  init() {
    this.set('include', ['tasks']);
  },
  embed: true
});
