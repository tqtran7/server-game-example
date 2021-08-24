
const WordWolf = require('../games/wordwolf');
const Room = require('../models/room');

async function test() {
    const room = new Room('Willy Pilly');
    room.addUser('Darin Garen');
    room.addUser('Chancey is Dancy');
    room.addUser('Uncle Thai');
    
    let game1 = new WordWolf(room);
    
    let req1 = { session: { scope: { username: 'Darin Garen' } } };
    await game1.addWordPair(req1, ['polite','tea']);
    
    let req2 = { session: { scope: { username: 'Chancey is Dancy' } } };
    //game1.addWordPair(req2, ['unmath','math']);
    
    let req3 = { session: { scope: { username: 'Uncle Thai' } } };
    //game1.addWordPair(req3, ['history','ahistory']);
    
    let req4 = { session: { scope: { username: 'Willy Pilly' } } };
    //game1.addWordPair(req4, ['runeterra','runterra']);
    
    //game1.assignCards();
    
    console.log(game1.jsonfy(game1.wordPairs));
}
test();

