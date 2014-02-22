var util = require('./utils');
var bind = util.bind;
var addEventListener = util.addEventListener;
var addClass = util.addClass;
var preloadimages = util.preloadimages;

var Fireworks = require('./fireworks');


var HtmlBoard = function(htmlBoardContainer, game) {
    this.htmlBoardContainer = htmlBoardContainer;
    this.game = game;
}

HtmlBoard.prototype.initializeGame = function() {
    var board = this.game.board;

    this._computeHtmlBoardSize();

    var cards = board.getAllCards();
    this.htmlCards = this._createHtmlCards(cards);

    var stacks = [].concat(
        board.getFoundationStacks(),
        board.getTableauStacks(),
        board.getStockStack())
    this.dropZoneStacks = this._createHtmlDropZoneStacks(stacks)

    this._listenForGameStateChanges();
    this._listenForHtmlBoardResize();
    this._listenForDropZoneStacksClicks();
}

HtmlBoard.prototype.restartGame = function() {
    Fireworks.terminate();
    this.game.clear();
    this.game.restart();
}

HtmlBoard.prototype.newGame = function() {
    Fireworks.terminate();
    this.game.clear();
    this.game.startNew();
}

HtmlBoard.prototype.preLoadImages = function(whenDoneCallback) {
    var images = [];
    var cards = this.game.deck.getCards();

    images.push(this._getImageBackUrl());
    for (i = 0; i < cards.length; ++i) {
        images.push(this._getImageUrl(cards[i]));
    }

    preloadimages(images).done(function(images) {
        // code that executes after all images are preloaded
        whenDoneCallback();
    });
}


HtmlBoard.prototype._computeHtmlBoardSize = function() {
    this.width = this.htmlBoardContainer.offsetWidth;
    this.height = this.htmlBoardContainer.offsetHeight;

    var cardRatio = 125 / 181.0;

    var cardWidthForContainerW = this.width * 7.6 / 100.0; //maximum width that fit in container
    var cardHeightForContainerW = cardWidthForContainerW / cardRatio;

    var cardHeightForContainerH = this.height * 16.2 / 100.0; //maximum height that fit in container
    var cardWidthForContainerH = cardHeightForContainerH * cardRatio;

    var cardWidth, cardHeight;

    if (cardWidthForContainerH < cardWidthForContainerW) {
        cardWidth = Math.round(cardWidthForContainerH);
        cardHeight = Math.round(cardHeightForContainerH);
    } else {
        cardWidth = Math.round(cardWidthForContainerW);
        cardHeight = Math.round(cardHeightForContainerW);
    }

    this.cardWidth = Math.round(cardWidth);
    this.cardHeight = Math.round(cardHeight);

    this.paddingLeft = Math.round(cardWidth * 40 / 100);
    this.paddingTop = Math.round(cardHeight * 20 / 100);

    this.cardOverlapWidth = Math.round(cardWidth * 25 / 100);
    this.cardOverlapHeight = Math.round(cardHeight * 20 / 100);

}

HtmlBoard.prototype._createHtmlCards = function(cards) {
    var htmlCards = [];
    var imgBackUrl = this._getImageBackUrl();

    for (i = 0; i < cards.length; ++i) {

        var card = cards[i];
        var cardId = this._getHtmlCardId(card);

        var htmlCard = document.createElement('img')
        htmlCard.id = cardId;
        htmlCard.src = imgBackUrl;
        htmlCard.width = this.cardWidth;
        htmlCard.height = this.cardHeight;
        htmlCard.sourceCard = card;
        htmlCard.style.zIndex = i + 1;

        lastCardCoord = this._findCardCoordinate(card);

        TweenLite.to(htmlCard, 0, {
            x: lastCardCoord[0],
            y: lastCardCoord[1]
        });

        htmlCards.push(htmlCard);

        this.htmlBoardContainer.appendChild(htmlCard);

        Draggable.create(htmlCard, {
            bounds: this.htmlBoardContainer,
            zIndexBoost: false,
            cursor: "pointer",
            onDragStartParams: [this, htmlCard],
            onDragStart: function(htmlBoard, htmlCard) {
                this.isReallyADrag = false;
            },
            onDragParams: [this, htmlCard],
            onDrag: function(htmlBoard, htmlCard) {
                if (this.isReallyADrag == false) {
                    this.isReallyADrag = true;
                    this.htmlCardsOnTop = htmlBoard._gethtmlCardsOnTop(htmlCard);
                    htmlBoard._boostZIndex(this.htmlCardsOnTop.concat(htmlCard), 200);
                }
                if (this.htmlCardsOnTop.length == 0)
                    return;

                var len = this.htmlCardsOnTop.length;
                for (var i = 0; i < len; i++) {
                    htmlCardToMove = this.htmlCardsOnTop[i];
                    TweenLite.to(htmlCardToMove, 0, {
                        x: htmlCard._gsTransform.x,
                        y: htmlCard._gsTransform.y + (len - i) * htmlBoard.cardOverlapHeight
                    });
                };
            },
            onDragEndParams: [this, htmlCard],
            onDragEnd: function(htmlBoard, htmlCard) {

                if (this.isReallyADrag == false)
                    return;

                htmlBoard._boostZIndex(this.htmlCardsOnTop.concat(htmlCard), -200);
                htmlBoard._onCardDragged(htmlCard, this.htmlCardsOnTop, this.endX, this.endY);

            },
            onClickParams: [this, htmlCard],
            onClick: function(htmlBoard, htmlCard) {
                htmlBoard._onCardClicked(htmlCard)
            }
        });

        TweenLite.set(htmlCard, {
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden"
        });
    }

    return htmlCards;
}



HtmlBoard.prototype._createHtmlDropZoneStacks = function(stacks) {
    var dropZoneStacks = [];
    for (var i = stacks.length - 1; i >= 0; i--) {
        var stack = stacks[i];

        var div = document.createElement('div');
        div.sourceStack = stack;
        var stackName = stack.getName();

        addClass(div, "dropZoneStack");
        addClass(div, stackName);

        toPx = function(nb) {
            return nb.toString() + "px";
        }

        coord = this._findDropZoneStackCoordinate(stack);
        div.style.left = toPx(coord[0]);
        div.style.top = toPx(coord[1]);
        div.style.width = toPx(this.cardWidth);
        div.style.height = toPx(this.cardHeight);

        this.htmlBoardContainer.appendChild(div);

        dropZoneStacks.push(div);
    };
    return dropZoneStacks;
}


HtmlBoard.prototype._getImageUrl = function(card) {
    return "images/cards/" + card.toString() + ".png";
}

HtmlBoard.prototype._getImageBackUrl = function() {
    return "images/cards/back.png";
}

HtmlBoard.prototype._listenForHtmlBoardResize = function() {
    _onHtmlBoardResized = bind(this._onHtmlBoardResized, this);
    document.body.onresize = _onHtmlBoardResized;
}

HtmlBoard.prototype._listenForDropZoneStacksClicks = function() {
    for (var i = this.dropZoneStacks.length - 1; i >= 0; i--) {
        var div = this.dropZoneStacks[i];
        if (div.sourceStack.getName() == "stock") {
            _onStockContainerClicked = bind(this._onStockContainerClicked, this);
            addEventListener(div, "click", _onStockContainerClicked);
            return;
        }
    };
}

HtmlBoard.prototype._listenForGameStateChanges = function() {
    _onCardStackChanged = bind(this._onCardStackChanged, this);
    _onBoardReset = bind(this._onBoardReset, this);
    _onCardRevealed = bind(this._onCardRevealed, this);
    _onCardHidded = bind(this._onCardHidded, this);
    _onGameWon = bind(this._onGameWon, this);

    Message(document).bind("Stack.newCard", _onCardStackChanged);
    Message(document).bind("Board.reset", _onBoardReset);
    Message(document).bind("Card.reveal", _onCardRevealed);
    Message(document).bind("Card.hide", _onCardHidded);
    Message(document).bind("Board.gameWon", _onGameWon);
}

HtmlBoard.prototype._onCardStackChanged = function(event, stack, card, oldStack) {
    this._placeCard(card);
}

HtmlBoard.prototype._onBoardReset = function(event, board) {
    var imgBackUrl = this._getImageBackUrl();
    for (var i = this.htmlCards.length - 1; i >= 0; i--) {
        var htmlCard = this.htmlCards[i];

        TweenLite.killTweensOf(htmlCard);

        htmlCard.src = imgBackUrl;
        htmlCard.style.zIndex = i + 1;

        TweenLite.to(htmlCard, 0, {
            x: -this.cardWidth - 5,
            y: 0,
            rotationY: 0,
            scaleX: 1,
            scaleY: 1,
            z: 0
        });
    };
}

HtmlBoard.prototype._onCardRevealed = function(event, card) {
    var imgUrl = this._getImageUrl(card);
    this._flipCardWithImage(card, imgUrl);
}

HtmlBoard.prototype._onCardHidded = function(event, card) {
    var imgUrl = this._getImageBackUrl(card);
    this._flipCardWithImage(card, imgUrl);
}

HtmlBoard.prototype._onCardDragged = function(htmlCard, htmlCardsOnTop, x, y) {
    targetedCard = this._findAdjacentCard(htmlCard, x, y);
    if (targetedCard != null) {
        moveOk = this.game.board.moveToStack(htmlCard.sourceCard, targetedCard.parentStack);
        if (moveOk)
            return;
    }
    targetedStack = this._findAdjacentStack(htmlCard, x, y);
    if (targetedStack != null) {
        moveOk = this.game.board.moveToStack(htmlCard.sourceCard, targetedStack);
        if (moveOk)
            return;
    }
    for (var i = htmlCardsOnTop.length - 1; i >= 0; i--) {
        this._placeHtmlCard(htmlCardsOnTop[i]);
    };
    this._placeHtmlCard(htmlCard);
}

HtmlBoard.prototype._onGameWon = function(event, board) {
    Fireworks.initialize("You win!", this.htmlBoardContainer);
}


HtmlBoard.prototype._onCardClicked = function(htmlCard) {
    var card = htmlCard.sourceCard;
    if (card.parentStack.getName() == "stock") {
        this.game.board.faceUpStock();
    }

}

HtmlBoard.prototype._onStockContainerClicked = function(event) {
    this.game.board.faceUpStock();
}

HtmlBoard.prototype._onHtmlBoardResized = function() {
    this._computeHtmlBoardSize();

    var coord, htmlCard;
    for (var i = 0; i < this.htmlCards.length; i++) {
        htmlCard = this.htmlCards[i];
        coord = this._findCardCoordinate(htmlCard.sourceCard);

        TweenLite.to(htmlCard, 1, {
            x: coord[0],
            y: coord[1],
            width: this.cardWidth,
            height: this.cardHeight,
            ease: Power2.easeInOut
        });
    };

    for (var i = 0; i < this.dropZoneStacks.length; i++) {
        var dz = this.dropZoneStacks[i];
        f = dz.sourceStack;
        coord = this._findDropZoneStackCoordinate(f);
        TweenLite.to(dz, 1, {
            left: coord[0],
            top: coord[1],
            width: this.cardWidth,
            height: this.cardHeight,
            ease: Power2.easeInOut
        });

    };
}

HtmlBoard.prototype._boostZIndex = function(htmlCards, boostValue) {
    for (var i = htmlCards.length - 1; i >= 0; i--) {
        current = parseInt(htmlCards[i].style.zIndex, 10);
        htmlCards[i].style.zIndex = current + boostValue;
    };
}

HtmlBoard.prototype._computeZIndex = function(card) {
    var htmlCard = this._findHtmlCard(card);

    var cardBehind = this.game.board.findCardBehind(card);
    if (cardBehind == null)
        return 1;

    var htmlCardBehind = this._findHtmlCard(cardBehind);

    return parseInt(htmlCardBehind.style.zIndex, 10) + 1;

}

HtmlBoard.prototype._getHtmlCardId = function(card) {
    return "card_" + card.toString();
}

HtmlBoard.prototype._findHtmlCard = function(card) {
    for (var i = this.htmlCards.length - 1; i >= 0; i--) {
        if (card.toString() == this.htmlCards[i].sourceCard.toString()) {
            return this.htmlCards[i];
        }
    }
    return null;
}

HtmlBoard.prototype._flipCardWithImage = function(card, imageUrl) {
    var htmlCard = this._findHtmlCard(card);

    var saveZ = htmlCard._gsTransform.z;
    TweenLite.to(htmlCard, 0.25, {
        rotationY: 90,
        scaleX: 1.1,
        scaleY: 1.1,
        z: this.cardWidth,
        ease: Power2.linear,
        onComplete: function() {
            htmlCard.src = imageUrl;
            TweenLite.to(htmlCard, 0.5, {
                rotationY: 0,
                scaleX: 1,
                scaleY: 1,
                ease: Power2.linear,
                onComplete: function() {
                    TweenLite.to(htmlCard, 0, {
                        z: saveZ
                    });
                }
            })
        }
    });
}

HtmlBoard.prototype._gethtmlCardsOnTop = function(htmlCard) {
    var card = htmlCard.sourceCard;
    var cardsOnTop = card.parentStack.getCardsOnTopOf(card);
    var htmlCardOnTop = [];
    for (var i = cardsOnTop.length - 1; i >= 0; i--) {
        htmlCardOnTop.push(this._findHtmlCard(cardsOnTop[i]));
    };
    return htmlCardOnTop;
}

HtmlBoard.prototype._findAdjacentCard = function(htmlCard, x, y) {

    tableauStacks = this.game.board.getTableauStacks();

    var candidat = null;
    var candidatDistance = null;

    var cardString = htmlCard.sourceCard.toString();
    for (var i = tableauStacks.length - 1; i >= 0; i--) {
        lastCard = tableauStacks[i].getLastCard();

        if (lastCard == null || lastCard.toString() == cardString)
            continue;

        lastCardCoord = this._findCardCoordinate(lastCard);

        intersect = this._intersectRect(x, y,
            this.cardWidth, this.cardHeight,
            lastCardCoord[0], lastCardCoord[1],
            this.cardWidth, this.cardHeight);

        if (intersect) {
            lastCardDistance = this._lineLength(x, y, lastCardCoord[0], lastCardCoord[1]);
            if (candidatDistance == null || lastCardDistance < candidatDistance) {
                candidatDistance = lastCardDistance;
                candidat = lastCard;
            }
        }
    };

    return candidat;
}

HtmlBoard.prototype._findAdjacentStack = function(htmlCard, x, y) {
    for (var i = this.dropZoneStacks.length - 1; i >= 0; i--) {
        stack = this.dropZoneStacks[i].sourceStack;

        coord = this._findDropZoneStackCoordinate(stack);

        intersect = this._intersectRect(x, y,
            this.cardWidth, this.cardHeight,
            coord[0], coord[1],
            this.cardWidth, this.cardHeight);

        if (intersect)
            return stack;
    };
    return null;
}

HtmlBoard.prototype._intersectRect = function(x1, y1, w1, h1, x2, y2, w2, h2) {
    return !(x2 > (x1 + w1) ||
        (x2 + w2) < x1 ||
        y2 > (y1 + h1) ||
        (y2 + h2) < y1);
}

HtmlBoard.prototype._lineLength = function(x, y, x0, y0) {
    var xd = Math.abs(x0 - x);
    var yd = Math.abs(y0 - y);
    return Math.sqrt(xd * xd + yd * yd);
}

HtmlBoard.prototype._placeHtmlCard = function(htmlCard, noDelay) {
    noDelay = typeof noDelay !== 'undefined' ? noDelay : false;

    var coord = this._findCardCoordinate(htmlCard.sourceCard);

    var finalZIndex = this._computeZIndex(htmlCard.sourceCard);
    if (finalZIndex >= 100) /* card behind already boosted ? */
        finalZIndex -= 100; /* final zIndex is not boosted */
    htmlCard.style.zIndex = finalZIndex;
    this._boostZIndex([htmlCard], 100);

    var draggableObj = Draggable.get(htmlCard);
    draggableObj.disable();

    var delay;
    if (noDelay) {
        delay = 0;
    } else {
        delay = 0.5;
    }

    TweenLite.to(htmlCard, delay, {
        x: coord[0],
        y: coord[1],
        ease: Power2.easeInOut,
        onCompleteScope: this,
        onComplete: function() {
            this._boostZIndex([htmlCard], -100);
            draggableObj.enable();
        }
    });
}


HtmlBoard.prototype._placeCard = function(card) {
    var htmlCard = this._findHtmlCard(card);
    this._placeHtmlCard(htmlCard);
}

HtmlBoard.prototype._findDropZoneStackCoordinate = function(stack) {
    var x = y = 0;

    switch (stack.getName()) {
        case "stock":
            x = this.paddingLeft;
            y = this.paddingTop;
            break;

        case "waste":
            x = this.paddingLeft + this.cardWidth + this.paddingLeft;
            y = this.paddingTop;
            break;

        case "tableau":
            x = (this.paddingLeft + this.cardWidth) * (2 + stack.getIndex()) + this.paddingLeft;
            y = (this.paddingTop + this.cardHeight) + this.paddingTop;
            break;

        case "foundation":
            x = (this.paddingLeft + this.cardWidth) * (5 + stack.getIndex()) + this.paddingLeft;
            y = this.paddingTop;
            break;
    }
    return [x, y]
}

HtmlBoard.prototype._findCardCoordinate = function(card) {
    var x = y = 0;
    var stack = card.parentStack;

    if (stack) {

        var coordStack = this._findDropZoneStackCoordinate(stack);
        x = coordStack[0];
        y = coordStack[1];
        if (stack.getName() == "tableau") {
            y += this.cardOverlapHeight * stack.getCardIndex(card);
        }

    } else {
        x = -this.cardWidth - 5;
        y = 0;
    }

    return [x, y]
}


module.exports = HtmlBoard;