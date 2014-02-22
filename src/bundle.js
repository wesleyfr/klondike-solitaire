(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"./message":7,"./stack":11,"./utils":12}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
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
},{"./card":2,"./message":7,"./utils":12}],4:[function(require,module,exports){
/**
 * Copyright (C) 2011 by Paul Lewis for CreativeJS. We love you all :)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */



Fireworks = new function() {

    // Big ol' <3'z to Paul Irish because, you know,
    // he's like a brother from another mother and stuff.
    requestAnimFrame = (function() {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(callback) {
                window.setTimeout(callback, 1000 / 60);
        };
    })();

    // declare the variables we need
    var particles = [],
        mainCanvas = null,
        mainContext = null,
        fireworkCanvas = null,
        fireworkContext = null,
        viewportWidth = 0,
        viewportHeight = 0,
        textToShow = '',
        started = false,
        canvasContainer = null;

    /**
     * Create DOM elements and get your game on
     */
    function initialize(text, htmlContainer) {
        _clearFireworks();

        canvasContainer = htmlContainer;

        // start by measuring the viewport
        onWindowResize(htmlContainer);

        // create a canvas for the fireworks
        mainCanvas = document.createElement('canvas');
        mainContext = mainCanvas.getContext('2d');

        textToShow = text;

        // and another one for, like, an off screen buffer
        // because that's rad n all
        fireworkCanvas = document.createElement('canvas');
        fireworkContext = fireworkCanvas.getContext('2d');

        // set up the colours for the fireworks
        createFireworkPalette(12);

        // set the dimensions on the canvas
        setMainCanvasDimensions();

        // add the canvas in
        htmlContainer.appendChild(mainCanvas);
        /*document.addEventListener('mouseup', createFirework, true);
        document.addEventListener('touchend', createFirework, true);*/

        started = true;
        // and now we set off
        update();

        scheduleCreateFirework();
    }

    function terminate() {
        started = false;
    }

    function scheduleCreateFirework() {
        var max = 1000;
        var min = 10;
        var wait = Math.floor(Math.random() * (max - min + 1) + min);
        setTimeout(createFirework, wait);
    }

    /**
     * Pass through function to create a
     * new firework on touch / click
     */
    function createFirework() {
        if (!started)
            return;
        var nb = getNbFireworks();
        if (nb < 15)
            createParticle();
        scheduleCreateFirework();
    }

    function _clearFireworks() {
        if (canvasContainer)
            canvasContainer.removeChild(mainCanvas);

        particles = [];
        mainCanvas = null;
        mainContext = null;
        fireworkCanvas = null;
        fireworkContext = null;
        viewportWidth = 0;
        viewportHeight = 0;
        textToShow = '';
        started = false;
        canvasContainer = null;
    }

    function getNbFireworks() {
        var nb = 0;
        for (var i = particles.length - 1; i >= 0; i--) {
            if (particles[i].usePhysics == false)
                nb += 1;
        };
        return nb;
    }

    /**
     * Creates a block of colours for the
     * fireworks to use as their colouring
     */
    function createFireworkPalette(gridSize) {

        var size = gridSize * 10;
        fireworkCanvas.width = size;
        fireworkCanvas.height = size;
        fireworkContext.globalCompositeOperation = 'source-over';

        // create 100 blocks which cycle through
        // the rainbow... HSL is teh r0xx0rz
        for (var c = 0; c < 100; c++) {

            var marker = (c * gridSize);
            var gridX = marker % size;
            var gridY = Math.floor(marker / size) * gridSize;

            fireworkContext.fillStyle = "hsl(" + Math.round(c * 3.6) + ",100%,60%)";
            fireworkContext.fillRect(gridX, gridY, gridSize, gridSize);
            fireworkContext.drawImage(
                Library.bigGlow,
                gridX,
                gridY);
        }
    }

    /**
     * Update the canvas based on the
     * detected viewport size
     */
    function setMainCanvasDimensions() {
        mainCanvas.width = viewportWidth;
        mainCanvas.height = viewportHeight;
    }

    /**
     * The main loop where everything happens
     */
    function update() {
        if (!started) {
            _clearFireworks();
            return;
        }
        clearContext();
        requestAnimFrame(update);
        drawFireworks();
    }

    /**
     * Clears out the canvas with semi transparent
     * black. The bonus of this is the trails effect we get
     */
    function clearContext() {
        mainContext.fillStyle = "rgba(0,0,0,0.2)";
        mainContext.fillRect(0, 0, viewportWidth, viewportHeight);
    }

    /**
     * Passes over all particles particles
     * and draws them
     */
    function drawFireworks() {
        var a = particles.length;

        while (a--) {
            var firework = particles[a];

            // if the update comes back as true
            // then our firework should explode
            if (firework.update()) {

                // kill off the firework, replace it
                // with the particles for the exploded version
                particles.splice(a, 1);

                // if the firework isn't using physics
                // then we know we can safely(!) explode it... yeah.
                if (!firework.usePhysics) {

                    if (Math.random() < 0.8) {
                        FireworkExplosions.star(firework);
                    } else {
                        FireworkExplosions.circle(firework);
                    }
                }
            }

            // pass the canvas context and the firework
            // colours to the
            firework.render(mainContext, fireworkCanvas);
        }


        mainContext.textAlign = 'center';
        mainContext.fillStyle = "#ddd";
        mainContext.font = "40px Verdana";
        mainContext.fillText(textToShow, mainCanvas.width / 2, mainCanvas.height / 2);

    }

    /**
     * Creates a new particle / firework
     */
    function createParticle(pos, target, vel, color, usePhysics) {

        pos = pos || {};
        target = target || {};
        vel = vel || {};

        particles.push(
            new Particle(
                // position
                {
                    x: pos.x || viewportWidth * 0.5,
                    y: pos.y || viewportHeight + 10
                },

                // target
                {
                    y: target.y || 150 + Math.random() * 100
                },

                // velocity
                {
                    x: vel.x || Math.random() * 3 - 1.5,
                    y: vel.y || 0
                },

                color || Math.floor(Math.random() * 100) * 12,

                usePhysics)
        );
    }

    /**
     * Callback for window resizing -
     * sets the viewport dimensions
     */
    function onWindowResize(htmlContainer) {
        viewportWidth = htmlContainer.offsetWidth;
        viewportHeight = htmlContainer.offsetHeight;
    }

    // declare an API
    return {
        initialize: initialize,
        createParticle: createParticle,
        terminate: terminate
    };

};

/**
 * Represents a single point, so the firework being fired up
 * into the air, or a point in the exploded firework
 */
var Particle = function(pos, target, vel, marker, usePhysics) {

    // properties for animation
    // and colouring
    this.GRAVITY = 0.06;
    this.alpha = 1;
    this.easing = Math.random() * 0.02;
    this.fade = Math.random() * 0.1;
    this.gridX = marker % 120;
    this.gridY = Math.floor(marker / 120) * 12;
    this.color = marker;

    this.pos = {
        x: pos.x || 0,
        y: pos.y || 0
    };

    this.vel = {
        x: vel.x || 0,
        y: vel.y || 0
    };

    this.lastPos = {
        x: this.pos.x,
        y: this.pos.y
    };

    this.target = {
        y: target.y || 0
    };

    this.usePhysics = usePhysics || false;

};

/**
 * Functions that we'd rather like to be
 * available to all our particles, such
 * as updating and rendering
 */
Particle.prototype = {

    update: function() {

        this.lastPos.x = this.pos.x;
        this.lastPos.y = this.pos.y;

        if (this.usePhysics) {
            this.vel.y += this.GRAVITY;
            this.pos.y += this.vel.y;

            // since this value will drop below
            // zero we'll occasionally see flicker,
            // ... just like in real life! Woo! xD
            this.alpha -= this.fade;
        } else {

            var distance = (this.target.y - this.pos.y);

            // ease the position
            this.pos.y += distance * (0.03 + this.easing);

            // cap to 1
            this.alpha = Math.min(distance * distance * 0.00005, 1);
        }

        this.pos.x += this.vel.x;

        return (this.alpha < 0.005);
    },

    render: function(context, fireworkCanvas) {

        var x = Math.round(this.pos.x),
            y = Math.round(this.pos.y),
            xVel = (x - this.lastPos.x) * -5,
            yVel = (y - this.lastPos.y) * -5;

        context.save();
        context.globalCompositeOperation = 'lighter';
        context.globalAlpha = Math.random() * this.alpha;

        // draw the line from where we were to where
        // we are now
        context.fillStyle = "rgba(255,255,255,0.3)";
        context.beginPath();
        context.moveTo(this.pos.x, this.pos.y);
        context.lineTo(this.pos.x + 1.5, this.pos.y);
        context.lineTo(this.pos.x + xVel, this.pos.y + yVel);
        context.lineTo(this.pos.x - 1.5, this.pos.y);
        context.closePath();
        context.fill();

        // draw in the images
        context.drawImage(fireworkCanvas,
            this.gridX, this.gridY, 12, 12,
            x - 6, y - 6, 12, 12);
        context.drawImage(Library.smallGlow, x - 3, y - 3);

        context.restore();
    }

};

/**
 * Stores references to the images that
 * we want to reference later on
 */
var Library = {
    bigGlow: document.createElement('img'),
    smallGlow: document.createElement('img')
};

Library.bigGlow.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABZ0RVh0Q3JlYXRpb24gVGltZQAyNi8xMi8xMcZdNcsAAAAcdEVYdFNvZnR3YXJlAEFkb2JlIEZpcmV3b3JrcyBDUzVxteM2AAAAw0lEQVQokZXSQUvDQBAF4K8SUgjBSCiFQo89+f9/izfRQ0CQElRCoSWgl7cQcxH3Mrvz5s28mdkNvv3jVKv3DWdMmIO32KFeE74w4B2fIdfo8IEj7qtF5gGvsSOu2KLHJXGnQjgn84AXvCWowSExDR4KYYqMMcHPuffBu+DTXRxzZF2TecRT7CX+G+ZCqNLgNqV7PMY28deoiqQ2ZfuF5sOihz54Wwi7jK5Mo1tN6Yg9doVQx1mmsd7DPni98ftr/LnpH5OqNW1n169XAAAAAElFTkSuQmCC";
Library.smallGlow.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAYAAADgzO9IAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABZ0RVh0Q3JlYXRpb24gVGltZQAyNi8xMi8xMcZdNcsAAAAcdEVYdFNvZnR3YXJlAEFkb2JlIEZpcmV3b3JrcyBDUzVxteM2AAAATUlEQVQImV3MPQ2AMBQE4K+EnaUOcFAROEAlTjohoDioh7K8JoRbLveb/DDGACnEhoKMjrpGseDAjgeWCHKYZ3CeQY/mFdzmVf0sG+4XEhkRBqSyQ+IAAAAASUVORK5CYII=";

/**
 * Stores a collection of functions that
 * we can use for the firework explosions. Always
 * takes a firework (Particle) as its parameter
 */
var FireworkExplosions = {

    /**
     * Explodes in a roughly circular fashion
     */
    circle: function(firework) {

        var count = 100;
        var angle = (Math.PI * 2) / count;
        while (count--) {

            var randomVelocity = 4 + Math.random() * 4;
            var particleAngle = count * angle;

            Fireworks.createParticle(
                firework.pos,
                null, {
                    x: Math.cos(particleAngle) * randomVelocity,
                    y: Math.sin(particleAngle) * randomVelocity
                },
                firework.color,
                true);
        }
    },

    /**
     * Explodes in a star shape
     */
    star: function(firework) {

        // set up how many points the firework
        // should have as well as the velocity
        // of the exploded particles etc
        var points = 6 + Math.round(Math.random() * 15);
        var jump = 3 + Math.round(Math.random() * 7);
        var subdivisions = 10;
        var radius = 80;
        var randomVelocity = -(Math.random() * 3 - 6);

        var start = 0;
        var end = 0;
        var circle = Math.PI * 2;
        var adjustment = Math.random() * circle;

        do {

            // work out the start, end
            // and change values
            start = end;
            end = (end + jump) % points;

            var sAngle = (start / points) * circle - adjustment;
            var eAngle = ((start + jump) / points) * circle - adjustment;

            var startPos = {
                x: firework.pos.x + Math.cos(sAngle) * radius,
                y: firework.pos.y + Math.sin(sAngle) * radius
            };

            var endPos = {
                x: firework.pos.x + Math.cos(eAngle) * radius,
                y: firework.pos.y + Math.sin(eAngle) * radius
            };

            var diffPos = {
                x: endPos.x - startPos.x,
                y: endPos.y - startPos.y,
                a: eAngle - sAngle
            };

            // now linearly interpolate across
            // the subdivisions to get to a final
            // set of particles
            for (var s = 0; s < subdivisions; s++) {

                var sub = s / subdivisions;
                var subAngle = sAngle + (sub * diffPos.a);

                Fireworks.createParticle({
                        x: startPos.x + (sub * diffPos.x),
                        y: startPos.y + (sub * diffPos.y)
                    },
                    null, {
                        x: Math.cos(subAngle) * randomVelocity,
                        y: Math.sin(subAngle) * randomVelocity
                    },
                    firework.color,
                    true);
            }

            // loop until we're back at the start
        } while (end !== 0);

    }

};


module.exports = Fireworks;
},{}],5:[function(require,module,exports){
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
},{"./board":1,"./deck":3}],6:[function(require,module,exports){
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
},{"./fireworks":4,"./utils":12}],7:[function(require,module,exports){
/**
 *
 * Message - An observer/listener pattern for Javascript.
 *    Usage:
 *    To bind a listener to a message on an object:
 *        Message( object ).bind( message_name, callback );
 *    To trigger all listeners bound on a message on an object:
 *        Message( object ).trigger( message_name, data );
 *    When calling a callback, it will be called in the contxt of the
 *        object being registered upon.  The input parameters will be:
 *        event, data1, data2, ..., dataN
 *    Example:
 *        var testObject = {};
 *        Message( testObject ).bind( 'testmessage', function( event, value1, value2 )
 *        {
 *            alert( 'event: ' + event.message + ' value1: ' + value1 + ' value2: ' + value2 );
 *        };
 *
 *        Message( testObject ).trigger( 'testmessage, [ 'testvalue1', 'testvalue2' ] );
 */
Message = function(object) {
    if (!object.__objectID) { // Gives the object an ID if it doesn't already have one.
        object.__objectID = (Message.currID++).toString();
    } // end if

    // return an object that contains the functions that can be worked with.
    return {
        bind: function(message, callback) {
            var handlers = Message.messages[message + object.__objectID] = Message.messages[message + object.__objectID] || [];
            handlers.push(callback);
            return this;
        },

        trigger: function(message, data) {
            var handlers = Message.messages[message + object.__objectID];
            if (handlers) {
                var event = {
                    target: object,
                    type: message
                };
                var callbackArgs = [event].concat(data || []);

                // go through all the handlers and call them with the arguments list we made up.
                for (var index = 0, handler; handler = handlers[index]; ++index) {
                    handler.apply(object, callbackArgs);
                } // end for
            } // end if
            return this;
        }
    };
};

/**
 * static variables used for the message processor.
 */
Message.messages = {};
Message.currID = 0;

module.exports = Message;
},{}],8:[function(require,module,exports){
/*!
 * classie - class helper functions
 * from bonzo https://github.com/ded/bonzo
 *
 * classie.has( elem, 'my-class' ) -> true/false
 * classie.add( elem, 'my-new-class' )
 * classie.remove( elem, 'my-unwanted-class' )
 * classie.toggle( elem, 'my-class' )
 */

/*jshint browser: true, strict: true, undef: true */
/*global define: false */

module.exports = new function() {

    'use strict';

    // class helper functions from bonzo https://github.com/ded/bonzo

    function classReg(className) {
        return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
    }

    // classList support for class management
    // altho to be fair, the api sucks because it won't accept multiple classes at once
    var hasClass, addClass, removeClass;

    if ('classList' in document.documentElement) {
        hasClass = function(elem, c) {
            return elem.classList.contains(c);
        };
        addClass = function(elem, c) {
            elem.classList.add(c);
        };
        removeClass = function(elem, c) {
            elem.classList.remove(c);
        };
    } else {
        hasClass = function(elem, c) {
            return classReg(c).test(elem.className);
        };
        addClass = function(elem, c) {
            if (!hasClass(elem, c)) {
                elem.className = elem.className + ' ' + c;
            }
        };
        removeClass = function(elem, c) {
            elem.className = elem.className.replace(classReg(c), ' ');
        };
    }

    function toggleClass(elem, c) {
        var fn = hasClass(elem, c) ? removeClass : addClass;
        fn(elem, c);
    }

    var classie = {
        // full names
        hasClass: hasClass,
        addClass: addClass,
        removeClass: removeClass,
        toggleClass: toggleClass,
        // short names
        has: hasClass,
        add: addClass,
        remove: removeClass,
        toggle: toggleClass
    };

    /*// transport
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(classie);
    } else {
        // browser global
        window.classie = classie;
    }*/

    return classie;

};
},{}],9:[function(require,module,exports){
var classie = require('./classie');

/**
 * modalEffects.js v1.0.0
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright 2013, Codrops
 * http://www.codrops.com
 */

module.exports = new function() {

    function init() {

        var overlay = document.querySelector('.md-overlay');

        [].slice.call(document.querySelectorAll('.md-trigger')).forEach(function(el, i) {

            var modal = document.querySelector('#' + el.getAttribute('data-modal')),
                close = modal.querySelector('.md-close');

            function removeModal(hasPerspective) {
                classie.remove(modal, 'md-show');

                if (hasPerspective) {
                    classie.remove(document.documentElement, 'md-perspective');
                }
            }

            function removeModalHandler() {
                removeModal(classie.has(el, 'md-setperspective'));
            }

            el.addEventListener('click', function(ev) {
                classie.add(modal, 'md-show');
                overlay.removeEventListener('click', removeModalHandler);
                overlay.addEventListener('click', removeModalHandler);

                if (classie.has(el, 'md-setperspective')) {
                    setTimeout(function() {
                        classie.add(document.documentElement, 'md-perspective');
                    }, 25);
                }
            });

            close.addEventListener('click', function(ev) {
                ev.stopPropagation();
                removeModalHandler();
            });

        });

    }

    // declare an API
    return {
        initialize: init
    };
    //init();
};
},{"./classie":8}],10:[function(require,module,exports){
window.onload = function() {
    var Game = require('./game');
    var HtmlBoard = require('./htmlBoard');

    var removeClass = require('./utils').removeClass;
    var addEventListener = require('./utils').addEventListener;


    var htmlBoardContainer = document.getElementById("game_board");
    htmlBoardContainer.innerHTML = "";
    removeClass(htmlBoardContainer, "loading");

    var hb = new HtmlBoard(htmlBoardContainer, new Game());
    hb.preLoadImages(function() {
        hb.initializeGame();
        hb.newGame();

        var newGameButton = document.getElementById("new_game");
        addEventListener(newGameButton, "click", function() {
            hb.newGame();
        });

        var restartGameButton = document.getElementById("restart_game");
        addEventListener(restartGameButton, "click", function() {
            hb.restartGame();
        });
    });

    var modalEffects = require('./modal/modalEffects');
    modalEffects.initialize();
}
},{"./game":5,"./htmlBoard":6,"./modal/modalEffects":9,"./utils":12}],11:[function(require,module,exports){
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
},{}],12:[function(require,module,exports){
var nativeBind = Function.prototype.bind;

var Utils = function() {}

Utils.random = function(min, max) {
    if (max == null) {
        max = min;
        min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
}

Utils.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    var value;
    for (var i = obj.length - 1; i >= 0; i--) {
        value = obj[i]
        rand = Utils.random(index++);
        shuffled[index - 1] = shuffled[rand];
        shuffled[rand] = value;
    };
    return shuffled;
}

Utils.bind = function(func, context) {
    var args, bound;
    var slice = Array.prototype.slice;

    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!(typeof func === 'function')) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
        if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
        ctor.prototype = func.prototype;
        var self = new ctor;
        ctor.prototype = null;
        var result = func.apply(self, args.concat(slice.call(arguments)));
        if (Object(result) === result) return result;
        return self;
    };

}

Utils.addEventListener = function(el, eventName, handler) {
    if (el.addEventListener)
        el.addEventListener(eventName, handler)
    else
        el.attachEvent('on' + eventName, handler)
}

Utils.removeEventListener = function(el, eventName, handler) {
    if (el.removeEventListener)
        el.removeEventListener(eventName, handler)
    else
        el.detachEvent('on' + eventName, handler)
}

Utils.preloadimages = function(arr) {
    var newimages = [],
        loadedimages = 0
    var postaction = function() {}
    var arr = (typeof arr != "object") ? [arr] : arr

        function imageloadpost() {
            loadedimages++
            if (loadedimages == arr.length) {
                postaction(newimages) //call postaction and pass in newimages array as parameter
            }
        }
    for (var i = 0; i < arr.length; i++) {
        newimages[i] = new Image()
        newimages[i].src = arr[i]
        newimages[i].onload = function() {
            imageloadpost()
        }
        newimages[i].onerror = function() {
            imageloadpost()
        }
    }
    return { //return blank object with done() method
        done: function(f) {
            postaction = f || postaction //remember user defined callback functions to be called when images load
        }
    }
}

Utils.addClass = function(el, className) {
    if (el.classList)
        el.classList.add(className);
    else
        el.className += ' ' + className;
}

Utils.removeClass = function(el, className) {
    if (el.classList)
        el.classList.remove(className);
    else
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
}


module.exports = Utils;
},{}]},{},[10])