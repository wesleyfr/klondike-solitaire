var Deck = require('./deck');
var Board = require('./board');

var Game = function() {
    this.deck = new Deck();
    this.board = new Board(this.deck);
}

Game.prototype.clear = function(shuffleDeck) {
    this.board.moveAllCardsToDeck();
}

Game.prototype.restart = function(shuffleDeck) {
    this.board.deal();
}

Game.prototype.startNew = function() {
    this.deck.shuffle();
    this.board.deal();
}

module.exports = Game;