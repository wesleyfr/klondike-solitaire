var Card = require('./card');
var Message = require('./message');
var shuffle = require('./utils').shuffle;


var Deck = function() {
    this._cards = [];

    var suits = ["h", "d", "c", "s"];

    for (var i = 0; i < suits.length; i++) {
        var suit = suits[i];
        for (var j = 1; j < 14; j++) {
            this._cards.push(new Card(suit, j));
        }
    };

    this.shuffle();
}

Deck.prototype.shuffle = function() {
    this._cards = shuffle(this._cards);
    this._cardsBackup = this._cards.slice(0); //clone array
}

Deck.prototype.takeCard = function() {
    return this._cards.pop();
}

Deck.prototype.reset = function() {
    this._cards = this._cardsBackup.slice(0); //clone array
}

Deck.prototype.count = function() {
    return this._cards.length;
}

Deck.prototype.getCards = function() {
    return this._cards;
}


module.exports = Deck;