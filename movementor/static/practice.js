import { config, board, game, resetGlobalVars, setPossibleMoves, setBoard } from './globals.js';
import { updateStatus } from './update.js';
import { lastFen, otherChoices, resetMoveVars, decMoveNum, makeComputerMove } from './move.js';
import { swapCapturedPieces } from './captured_pieces.js';
import { playGameStart } from './sounds.js';

$('#restartBtn').on('click', function() {
    console.clear();
    var element = document.getElementsByClassName('move-list-num');
    for (let i = 0; i < element.length; i++) {
        element[i].hidden = true;
    };
    element = document.getElementsByClassName('move-list');
    for (let i = 0; i < element.length; i++) {
        element[i].innerHTML = '';
    };
    resetGlobalVars();
    resetMoveVars();
    playGameStart();
    updateStatus();
    if (game.turn() == 'w' && config.orientation == 'black') {
        window.setTimeout(makeComputerMove, 1000);
    };
});
  
$('#difLineBtn').on('click', function () {
    if (otherChoices.length == 0) {
        console.log('No other lines were available');
    }
    else {
        if (game.turn() == 'w' && config.orientation == 'black' || 
            game.turn() == 'b' && config.orientation == 'white') {
                game.undo();
        };
        if (game.turn() == 'w') {
            decMoveNum();
        };
        game.undo();
        board.position(lastFen);
        resetGlobalVars(true);
        setPossibleMoves(otherChoices);
        window.setTimeout(makeComputerMove, 500);
    };
});

$('#switchBtn').on('click', function () {
    config.orientation = config.orientation == 'white' ? 'black' : 'white';
    config.position = game.fen();
    swapCapturedPieces();
    setBoard();
    if (game.turn() == 'w' && config.orientation == 'black' || 
        game.turn() == 'b' && config.orientation == 'white') {
        window.setTimeout(makeComputerMove, 500);
    };
});

$('#hintBtn').on('click', function () {
    this.innerHTML = this.innerHTML == 'Show Hints' ? 'Hide Hints' : 'Show Hints';
    var hintElement = document.getElementById('hints');
    hintElement.hidden = !hintElement.hidden;
});