
const uuid = require('uuid');

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
