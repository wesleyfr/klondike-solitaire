module.exports = Card = function(suit, value) {
    this.suit = suit;
    this.value = value;
    this._isHidden = true;
    this.name = this._getName()
}

Card.prototype.reveal = function() {
    if (this._isHidden == false)
        return;
    this._isHidden = false;
    Message(document).trigger("Card.reveal", [this]);
}

Card.prototype.hide = function() {
    if (this._isHidden == true)
        return;
    this._isHidden = true;
    Message(document).trigger("Card.hide", [this]);
}

Card.prototype.reset = function() {
    this._isHidden = true;
}

Card.prototype.isHidden = function() {
    return this._isHidden;
}

Card.prototype.getColor = function() {
    if (this.suit == "h" || this.suit == "d")
        return "red";
    return "black";
}

Card.prototype.getValue = function() {
    return this.value;
}

Card.prototype.isSameColor = function(cardToCompare) {
    return this.getColor() == cardToCompare.getColor();
}

Card.prototype.isNextValueOf = function(cardToCompare) {
    return (this.value + 1) == cardToCompare.value;
}

Card.prototype.isLastValueOf = function(cardToCompare) {
    return (this.value - 1) == cardToCompare.value;
}

Card.prototype.isSameSuit = function(cardToCompare) {
    return this.suit == cardToCompare.suit;
}


Card.prototype._getName = function() {
    var numString;

    switch (this.value) {
        case 10:
            numString = "X";
            break;
        case 11:
            numString = "J";
            break;
        case 12:
            numString = "Q";
            break;
        case 13:
            numString = "K";
            break;
        default:
            numString = this.value.toString();
    }
    return numString + this.suit.toUpperCase();
};

return Card.prototype.toString = function() {
    return this.name;
}