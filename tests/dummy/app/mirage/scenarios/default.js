export default function(server) {

  // Seed your development database using your factories. This
  // data will not be loaded in your tests.

  server.createList('user', 20);
  server.createList('task', getRandomInt(10, 20));
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
