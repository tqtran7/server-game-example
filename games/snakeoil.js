
const persons = require('../data/person');
const descriptor = require('../data/descriptor');
const gadget = require('../data/gadget');
const socket = require('../middlewares/socket');

class SnakeOil {

  constructor(room) {
    this.room = room;
    this.load();
    this.broadcast();
  }

  load() {

    // Pick two random cards for customer
    // A person and descriptor
    let p = this.shuffle(this.clone(persons));
    let d = this.shuffle(this.clone(descriptor));
    let g = this.shuffle(this.clone(gadget));
    let randomPerson = this.random(p.length);
    let randomDescriptor = this.random(d.length);

    // Pick a customer and assign cards
    this.pickCustomer();
    this.players = new Map();
    this.players.set(this.customer.getName(), [
      ...d.splice(randomDescriptor, 1),
      ...p.splice(randomPerson, 1),
    ]);

    // Reshuffle deck and give everyone else cards
    this.cards = [ ...p, ...d, ...g, ];
    this.shuffle(this.cards);
    this.dealCards();
  }

  broadcast() {
    let customerName = this.customer.getName();
    let customerCards = this.players.get(customerName);
    this.players.forEach((cards, playerName) => {
      let sid = this.room.getUser(playerName).getId();
      let data = {
        customer: {
          name: customerName,
          cards: customerCards
        },
        cards: cards,
      };
      console.log(sid, data);
      socket.broadcast('OnGameStart', [sid], data);
    });
  }

  clone(data) {
    return JSON.parse(JSON.stringify(data));
  }

  shuffle(cards) {
    cards.sort((a,b) => {
      return this.random(2) - 1;
    });
    return cards;
  }

  random(n) {
    return Math.floor(Math.random() * n);
  }

  pickCustomer() {
    let list = Array.from(this.room.users.keys());
    let rand = this.random(list.length);
    let customerName = list[rand];
    this.customer = this.room.users.get(customerName);
  }

  getCustomer() {
    return this.customer;
  }

  // Give customer 2 cards: person and descriptor
  // Give everyone else 7 random cards
  dealCards() {
    this.room.users.forEach((user, name) => {
      if (user != this.customer) {
        this.players.set(name, this.distributeCards(7));
      }
    });
  }

  distributeCards(n) {
    return this.cards.splice(0, n);
  }

  jsonfy(map) {
    let json = {};
    map.forEach((value, key) => { json[key] = value; });
    return json;
  }

  toString() {
    return {
      customer: this.customer,
      players: this.jsonfy(this.players),
    };
  }
  
}

module.exports = SnakeOil;
