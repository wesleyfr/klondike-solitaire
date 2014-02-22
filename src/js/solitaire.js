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