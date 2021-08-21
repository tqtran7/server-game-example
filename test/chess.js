
const Chess = require('../games/chess');
const Room = require('../models/room');

const room = new Room('Willy Pilly');
room.addUser('Darin Garen');
room.addUser('Chancey is Dancy');
room.addUser('Uncle Thai');

let game1 = new Chess();

game1.fen();
