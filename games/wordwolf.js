
const socket = require('../middlewares/socket');
const rp = require('request-promise');

class WordWolf {

  //homer work: give out words to proper person, wolf card for wolf and other word for other people

  /*
    0a. every player needs a name card
    0b. have custamizable timer

    1.Every player types in 2 simmilar words that may be used in play
      1a. 2 text inputs
      1b. submit button

    2.After you have finished selecting your words, each player will press submit and wait for other players
      2a. colletcion of words, after submit has been pressed
      2b. 30 sec timer, any one who didn't submit will not have their words in the pool of selectable words
      2c. map with words as the values

    3.Once all players have pressed submit, randomly, a pair of words from one player will be chosen to play with
      3a. randomly choose a number between 0 and (array length - 1)
      3b. choose the array pair in the map with the index

    4.One player will get one card out of the pair (this is the wolf) while everyone else gets the other card in the pair
      4a. randomly choose a number between 0 and 1
      4b. pick the word in the index to be the wolf word
      4c. randomly choose a player to be the wolf
      4d. give all other players the non wolf card

    5.Everyone will talk amongst each other trying to clear themselves of having susspession as the wolf, while trying to figure out who the wolf is (it could even be yourself)
      5a. set a timer using the custamizable timer
      5b. all players have a "pause timer" button whitch pauses the timer and becomes a "resume timer" button
      5c. host has a "end timer" button whitch ends the timer
    6.The way a disscussion works is someone asks the first question to a specific person, they then answer and ask a question to someone else

    7.After the set amount of time disscussing, everyone will vote for the player they think have the odd word out (the wolf)
      7a. all player name tags become buttons
      7b. collection of votes in a map, with each player being the key and their votes being the values

    8.If the majority votes correctly they win, otherwise the wolf wins
      8a. analysis of votes
      8b. sending out losing messages and winning messages to each player depending on their win or loss
    9.Both words are revealed
      9a. underneath the win / loss screen will be the 2 words
  */

/*
map={key = value}
key=players
value=votes they have
*/

  constructor(room) {
    this.room = room;
    this.wordPairs = new Map();
    this.assignedCards = new Map();
    this.tallyMap = new Map();
    this.players = [];
  }

  tally(req, player){
    let value = 1;
    if (this.tallyMap.has(player)) {
      value += this.tallyMap.get(player);
    }
    console.log(player,value);
    this.tallyMap.set(player, value);
    let sids = this.room.getUserIds();
    let json = this.jsonfy(this.tallyMap);
    console.log(this.tallyMap);
    console.log(json);
    socket.broadcast('OnTallyVote', sids, json);
  }

  random(n) {
    return Math.floor(Math.random() * n);
  }

  async addWordPair(req, words){
    //take user text input
    //words is 1 string
    //["a","b"]\
    const double = 2;
    const count = 5;
    let username = req.session.scope.username;
    this.players.push(username);
    let word = words[this.random(double)];
    let wordPair = await this.getSynonym(word, count);
    if(wordPair.length >= count)
    {
      for(let x = wordPair.length - 2; x > 0; x--)
      {
        let snap = this.random(wordPair.length);
        let gg = wordPair.splice(snap, 1);
        wordPair = gg;
      }
      this.wordPairs.set(username, wordPair);
    }
  }

  async getSynonym(word, count){
    let options = {
      uri: `https://api.datamuse.com/words?ml=${word}`,
      json: true,
    };
    let words = await rp(options);
    return words.slice(0, count).map(x => x.word);
  }

  selectWordPair(){
    //randomly selects word pair
    let usernames = Array.from(this.wordPairs.keys());
    let rand = this.random(usernames.length);
    let randUser = usernames[rand];
    if(this.wordPairs.get(randUser))
    {
      this.selectedWordPair = this.wordPairs.get(randUser);
    }
  }

  selectWolf() {
    //randomly selects player and gives them the odd word out
    let rand = this.random(this.players.length);
    this.wolf = this.players[rand];
  }

// will addition start
  randomizePair(){
    let rand = this.random(2);
    this.wolfCard = this.selectedWordPair[rand];
    if (rand == 0){
      this.nonWolfCard = this.selectedWordPair[1];
    }
    else {
      this.nonWolfCard = this.selectedWordPair[0];
    }
  }

  broadcast(){
    this.selectWordPair();
    this.selectWolf();
    this.randomizePair();
    this.wordPairs.forEach((wordPair, username) => {
      //bassically we will check wether or not the player is the wolf and if they arent we add them to the list with the non wolf card
      let word = this.nonWolfCard;
      if (username == this.wolf){
        word = this.wolfCard;
      }

      this.assignedCards.set(username, word);
      let userid = this.room.getUser(username).getId();
      console.log(this.assignedCards, userid, {word});
      socket.broadcast('OnAssignCards', [userid], {word});
    });
    console.log(this.selectedWordPair);
    console.log(this.wolf);
    console.log(this.wolfCard);
    console.log(this.nonWolfCard);
  }
// will addition end

  canStart(){
    let condition = {
      canStart: this.room.users.size >= 3,
      errorMessage: 'Not Enough Players!',
    };
    console.log(condition);
    return condition;
  }

  jsonfy(map) {
    let json = {};
    map.forEach((value, key) => {
      json[key] = value;
    });
    return json;
  }

  toString() {
    return {
      pairs: this.wordPairs,
      selected: this.selectedWordPair,
    };
  }

}

module.exports = WordWolf;
