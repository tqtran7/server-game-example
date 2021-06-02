
const socket = require('../middlewares/socket');

class WordWolf {

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

  constructor(room) {
    this.room = room;
    this.wordPairs = new Map();
  }

  random(n) {
    return Math.floor(Math.random() * n);
  }

  addWordPair(req, words){
    //take user text input
    let username = req.session.scope.username;
    this.wordPairs.set(username, words);
  }

  selectWordPair(){
    //randomly selects word pair
    let usernames = Array.from(this.wordPairs.keys());
    let rand = this.random(usernames.length);
    let randUser = usernames[rand];
    this.selectedWordPair = this.wordPairs.get(randUser);
  }

  selectWolf() {
    //randomly selects player and gives them the odd word out
    let players = Array.from(this.wordPairs.keys());
    let rand = this.random(players.length);
    this.wolf = players[rand];
  }

//  assignWolfCard(){
//    selectWolf()
//  }

  jsonfy(map) {
    let json = {};
    map.forEach((value, key) => {
      json[key] = value.cards;
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
