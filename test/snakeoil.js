
const SnakeOil = require('../games/snakeoil');
const Room = require('../models/room');

const room = new Room('Willy Pilly');
room.addUser('Darin Garen');
room.addUser('Chance Mance');

let game1 = new SnakeOil(room);
console.log(game1.toString());

game1.hi = 'hello';
console.log(game1);