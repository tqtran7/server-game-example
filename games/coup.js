
const coupdeck = require('../data/coupdeck');
const socket = require('../middlewares/socket');

class Coup {

  /*

    COUP
    3-6 player game
    0. setup
      a. get the deck of cards from data and duplicate it
      b. randomize the deck of cards
      c. game can only start if there are more than 3 people but less than 7
    1. game start, every player gets 2 coins and 2 Cards
      a. give 2 cards and 2 coins to every player
    2. on a players turn they may do any one action
      a. uncontestibale actions
        income = gain 1 coin
        foreign aid = gain 2 coins
        Coup = lose 7 coins and make someone lose a card
                (must be used if you have 10 or more coins)
      b. contestable actions
        DUKE
          tax = gain 3 coins
          counter action = blocks foreign aid
        ASSASSIN
          assassinate = lose 3 coins and assassinate a player
                        (makes them lose a card)
        CONTESSA
          conter action = blocks assassination
        CAPTIAN
          steal = take 2 coins from another player
          counter action = blocks steal
        AMBASSADOR
          exchange = draw 2 cards from the deck,
                    put 2 cards back into the deck
          counter action = blocks steal
    3. when a player loses both cards they lose the game
        last one standing wins the game

  */

  constructor(room) {
    this.room = room;
    this.players = new Map();
    this.deck = this.clone(coupdeck);
  }

  shuffle() {
    this.deck.sort((a,b) => {
      return this.random(2) - 1;
    });
  }

  deal() {
    this.shuffle();
    this.room.users.forEach((user, name) => {
      this.players.set(name, {
        cards: this.distributeCards(2),
        coins: 2,
      });
      console.log(this.players.get(name).cards);
    });
  }

  review(){
    //purely for testing
    this.room.users.forEach((user, name) => {
      console.log(this.players.get(name));
    });
    console.log(this.deck);
  }

  distributeCards(n) {
    return this.deck.splice(0, n);
  }

  random(n) {
    return Math.floor(Math.random() * n);
  }

  clone(data) {
    return JSON.parse(JSON.stringify(data));
  }

  broadcast(){}

  canStart(){
    let condition = {
      canStart: this.room.users.size >= 3 && this.room.users.size < 7,
      errorMessage: 'Need 3-6 players!',
    };
    console.log(condition);
    return condition;
  }

  check(){
    //checks if all players allow a certian action
    //return(useability);
  }

  use(req, action, player){
    let username = req.session.scope.username;
    let boolean = check();
    if (boolean){
      //do action
    }
    else{
      counterAction();
    }
  }

  counterAction(){
    //checks if any player wants to counter certian action
    
  }

  removeCard(target, amount){
    /*target will get to choose the card that is tossed,
    however for testing it will be the first card */
    if (this.players.has(target)) {
      let playerInfo = this.players.get(target);
      let handClone =  playerInfo.cards.splice(0, amount);
      this.deck.push(handClone);
      console.log(this.deck);
      this.shuffle();
      let userid = this.room.getUser(target).getId();
      socket.broadcast('OnPlayerCardChange', [userid], {
        name: target,
        cards: playerInfo,
      });
    }
  }

  stealCoins(target, amount){
    if (this.players.has(target)) {
      let playerInfo = this.players.get(target);
      playerInfo.coins -= amount;
      let sids = this.room.getUserIds();
      socket.broadcast('OnPlayerCoinChange', sids, {
        name: target,
        cards: playerInfo,
      });
    }
  }

  //actions
  income(req, player){
    let username = req.session.scope.username;
    if (this.players.has(username)) {
      let playerInfo = this.players.get(username);
      playerInfo.coins += 1;
      let sids = this.room.getUserIds();
      socket.broadcast('OnPlayerCoinChange', sids, {
        name: username,
        cards: playerInfo,
      });
    }
  }

  foreignAid(req, player){
    let username = req.session.scope.username;
    if (this.players.has(username)) {
      let playerInfo = this.players.get(username);
      playerInfo.coins += 2;
      this
      let sids = this.room.getUserIds();
      socket.broadcast('OnPlayerCoinChange', sids, {
        name: username,
        cards: playerInfo,
      });
    }
  }

  coup(req, player, target){
    /* This will have to be changed to it being the
    only action avalible once you have 10 or more coins*/
    let username = req.session.scope.username;
    if (this.players.has(username)) {
      let playerInfo = this.players.get(username);
      if (playerInfo.coins >= 7) {
          playerInfo.coins -= 7;
          this.removeCard(target, 1);
          let sids = this.room.getUserIds();
          socket.broadcast('OnPlayerCoinChange', sids, {
            name: username,
            cards: playerInfo,
          });
      }
    }
  }

  tax(req, player){
    /* This will have to be changed to it only going off
    if it didn't get countered or contested but for now it is fine*/
    let username = req.session.scope.username;
    if (this.players.has(username)) {
      let playerInfo = this.players.get(username);
      playerInfo.coins += 3;
      let sids = this.room.getUserIds();
      socket.broadcast('OnPlayerCoinChange', sids, {
        name: username,
        cards: playerInfo,
      });
    }
  }

  steal(req, player, target){
    /* This will have to be changed to it only going off
    if it didn't get countered or contested but for now it is fine*/
    let username = req.session.scope.username;
    if (this.players.has(username)) {
      let playerInfo = this.players.get(username);
      playerInfo.coins += 2;
      this.stealCoins(target, 2);
      let sids = this.room.getUserIds();
      socket.broadcast('OnPlayerCoinChange', sids, {
        name: username,
        cards: playerInfo,
      });
    }
  }

  exchange(req, player){
    /* This will have to be changed to it only going off
    if it didn't get countered or contested but for now it is fine*/
    let username = req.session.scope.username;
    console.log(username);
    if (this.players.has(username)) {
      console.log("hello");
      let playerInfo = this.players.get(username);
      if (playerInfo.cards.length > 0) {
        console.log("we made it!");
        let filler = this.distributeCards(2);
        console.log(filler);
        playerInfo.cards.push(filler);
        let userid = this.room.getUser(username).getId();
        socket.broadcast('OnPlayerCardChange', [userid], {
          name: username,
          cards: playerInfo,
        });
        console.log(playerInfo.cards);
        this.removeCard(player, 2);
      }
    }
  }

  assassinate(req, player, target){
    /* This will have to be changed to it only going off
    if it didn't get countered or contested but for now it is fine*/
    let username = req.session.scope.username;
    if (this.players.has(username)) {
      let playerInfo = this.players.get(username);
      if (playerInfo.coins >= 3) {
          playerInfo.coins -= 3;
          this.removeCard(target, 1);
          let sids = this.room.getUserIds();
          socket.broadcast('OnPlayerCoinChange', sids, {
            name: username,
            cards: playerInfo,
          });
      }
    }
  }

  //counter actions
  challenge(req, player, target){

  }

  antiForignAid(req, player){

  }

  antiAssassination(req, player){

  }

  antiSteal(req, player){

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

module.exports = Coup;
