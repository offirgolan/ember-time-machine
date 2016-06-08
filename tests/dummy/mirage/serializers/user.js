import BaseSerializer from './application';

export default BaseSerializer.extend({
  include: ['tasks'],
  embed: true
});
