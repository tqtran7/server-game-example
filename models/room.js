
const User = require('./user');
const assert = require('assert');
const crypto = require('crypto');

class Room {

  constructor(host) {
    assert(host);
    this.roomcode = crypto.randomBytes(2).toString('hex');
    this.host = new User(host);
    this.users = new Map();
    this.users.set(this.host.name, this.host);
  }

  getRoomCode() {
    return this.roomcode;
  }

  addUser(name) {
    assert(name);
    let user = new User(name);
    if (!this.users.has(name)) {
      this.users.set(name, user);
    }
  }

  getUser(name) {
    assert(name);
    if (this.users.has(name)) {
      return this.users.get(name);
    }
  }

  getUserIds() {
    return Array.from(this.users.values())
      .map(user => user.getId());
  }

  removeUser(name) {
    assert(name);
    if (this.users.has(name)) {
      this.users.delete(name);
    }
  }

  toString() {
    return {
      roomcode: this.roomcode,
      host: this.host.name,
      users: Array.from(this.users.keys())
    };
  }

}

module.exports = Room;
