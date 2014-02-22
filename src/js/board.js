var Stack = require('./stack');
var Message = require('./message');
var shuffle = require('./utils').shuffle;


var Board = function(deck) {
    this._deck = deck;
    this._stock = new Stack("stock", 0);
    this._waste = new Stack("waste", 0);
    this._allCards = this._deck.getCards().slice(0); //clone array

    this._foundations = []
    for (var i = 0; i < 4; i++) {
        var foundation = new Stack("foundation", i)
        this._foundations.push(foundation);
    }

    this._tableau = []
    for (var i = 0; i < 7; i++) {
        var col = new Stack("tableau", i)
        this._tableau.push(col);
    }

}

Board.prototype.getAllCards = function() {
    return this._allCards;
}

Board.prototype.getFoundationStacks = function() {
    return this._foundations;
}

Board.prototype.getTableauStacks = function() {
    return this._tableau;
}

Board.prototype.getStockStack = function() {
    return this._stock;
}

Board.prototype.moveAllCardsToDeck = function() {
    for (var i = this._allCards.length - 1; i >= 0; i--) {
        var card = this._allCards[i];
        card.reset();
        if (card.parentStack)
            card.parentStack.remove(card);
    };
    this._deck.reset();

    Message(document).trigger("Board.reset", [this]);
}

Board.prototype.deal = function() {

    for (var i = 0; i < this._tableau.length; i++) {
        var tableauStack = this._tableau[i];

        for (var col = 0; col <= i; col++) {
            tableauStack.push(this._deck.takeCard());
        }

        tableauStack.getLastCard().reveal();
    }

    while (this._deck.count() > 0)
        this._stock.push(this._deck.takeCard());
}

Board.prototype.faceUpStock = function() {
    if (this._stock.count() == 0)
        this.fillStockFromWaste();

    if (this._stock.count() == 0)
        return;

    var card = this._stock.pop();
    this._waste.push(card);
    card.reveal();
}

Board.prototype.fillStockFromWaste = function() {
    var card;
    while (this._waste.count() > 0) {
        card = this._waste.pop()
        card.hide();
        this._stock.push(card);
    }
}

Board.prototype.findCardBehind = function(card) {
    if (!card.parentStack)
        return null;
    var stackCards = card.parentStack.getCards();
    for (var i = stackCards.length - 1; i >= 0; i--) {
        if (stackCards[i] == card) {
            if (i == 0)
                return null;
            return stackCards[i - 1];
        }
    };
}

Board.prototype.checkIfGameWon = function() {
    if (this._waste.count() > 0)
        return false;
    if (this._stock.count() > 0)
        return false;
    for (var i = this._tableau.length - 1; i >= 0; i--) {
        if (this._tableau[i].count() > 0)
            return false;
    };

    Message(document).trigger("Board.gameWon", [this]);
}



Board.prototype.moveToStack = function(card, stack) {
    if (this._moveAllowed(card, stack)) {
        old_stack = card.parentStack;
        var cardsOnTop = card.parentStack.getCardsOnTopOf(card);
        var allCards = [card].concat(cardsOnTop);
        for (var i = 0; i < allCards.length; i++) {
            var card = allCards[i];
            card.parentStack.remove(card);
            stack.push(card);
        };

        var lastCardOldStack = old_stack.getLastCard();
        if (lastCardOldStack)
            lastCardOldStack.reveal();
        else
            this.checkIfGameWon();

        return true;
    }
    return false;
}

Board.prototype._moveAllowed = function(card, stack) {
    if (card.parentStack == stack)
        return false;
    if (card.isHidden())
        return false;

    //return true;

    var stackName = stack.getName();
    var stackLastCard = stack.getLastCard();

    if (stackName == "foundation") {
        if (card.parentStack.getCardsOnTopOf(card).length > 0)
            return false;
        if (stackLastCard == null &&
            card.getValue() == 1)
            return true;
        if (stackLastCard &&
            card.isSameSuit(stackLastCard) &&
            card.isLastValueOf(stackLastCard))
            return true;

        return false;
    }

    if (stackName == "tableau") {
        if (stackLastCard == null &&
            card.getValue() == 13)
            return true;
        if (stackLastCard &&
            card.isSameColor(stackLastCard) == false &&
            card.isNextValueOf(stackLastCard))
            return true;

        return false;
    }

    return false;
}

module.exports = Board;