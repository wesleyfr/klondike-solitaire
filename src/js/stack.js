var Stack = function(name, index) {
    this._name = name;
    this._index = index;
    this._cards = [];
}

Stack.prototype.getLastCard = function(card) {
    var len = this._cards.length;
    if (len == 0)
        return null;
    return this._cards[len - 1];
}

Stack.prototype.getCards = function(card) {
    return this._cards;
}

Stack.prototype.count = function() {
    return this._cards.length;
}

Stack.prototype.push = function(card) {
    this._cards.push(card);
    var oldStack = card.parentStack;
    card.parentStack = this;
    Message(document).trigger("Stack.newCard", [this, card, oldStack]);
}

Stack.prototype.pop = function() {
    card = this._cards.pop();
    card.parentStack = null;
    return card;
}

Stack.prototype.remove = function(card) {
    var idx = this.getCardIndex(card);
    if (idx >= 0)
        this._cards.splice(idx, 1);
}

Stack.prototype.getName = function() {
    return this._name;
}

Stack.prototype.getIndex = function() {
    return this._index;
}

Stack.prototype.getCardIndex = function(card) {
    var cardString = card.toString();
    for (var i = this._cards.length - 1; i >= 0; i--) {
        if (this._cards[i].toString() == cardString) {
            return i;
        }
    };
    return -1;
}

Stack.prototype.getCardsOnTopOf = function(card) {
    var cardsOnTop = [];
    var cardString = card.toString();
    for (var i = this._cards.length - 1; i >= 0; i--) {
        if (this._cards[i].toString() != cardString) {
            cardsOnTop.unshift(this._cards[i]);
        } else {
            return cardsOnTop;
        }
    };
    return cardsOnTop;
}

module.exports = Stack;