const chessboard = require('../data/chessboard');
const socket = require('../middlewares/socket');

class Chess {

  /*
  draw must take a string (chess board) and split it into readable letters
  */
/*
  draw(){
    let placement = chessboard.split('');
    let board = [[],[],[],[],[],[],[],[],];
    let rank = 0;
    for (let i=0; i<64; i++){
      if (placement[i]!="/"){
        if (typeof placement[i] === 'number'){
          for (x=board[rank].length-1; x<placement[i]; x++){
            board[rank][x]="-";
          }
        }
        else{
          board[rank][board[rank].length-1]=placement[i];
        }
      }
      else{
        rank+=1;
      }
    }
    console.log(board);
  }
*/

  fen(){
    let placement = chessboard;
    let fenNotation = "";
    for (let i = 0; i < placement.length; i++){
      for (let x = 0; x <= placement[i].length; x++){
        if (x == placement[i].length){
          fenNotation = fenNotation + "/";
        }
        else if (placement[i][x] == "-"){
          let blank = 1;
          while (placement[i][x] == "-"){
            x++;
            if (placement[i][x] == "-"){
                if (x != placement[i].length){
                blank++;
              }
            }
          }
          x--;
          blank.toString();
          fenNotation = fenNotation + blank;
          if (x == placement[i].length){
            fenNotation = fenNotation + "/";
          }
        }
        else{
          fenNotation = fenNotation + placement[i][x];
        }
      }
    }
    //he wont notice
    let updated = fenNotation.substring(0, fenNotation.length - 1);
    console.log(updated);
  }
}

module.exports = Chess;
