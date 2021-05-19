
const uuid = require('uuid');

/**
 * Creates a new user with id and name.
 * @example new User('John Smith');
 */
class User {

  constructor(name) {
    this.id = uuid.v4();
    this.name = name;
  }

  getId() {
    return this.id;
  }

  getName() {
    return this.name;
  }

}

module.exports = User;
