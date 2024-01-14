import { board, game, setPossibleMoves, setFinished, setKeepPlaying, swapBoard, resetBoard } from './globals.js';
import { timeoutBtn, oppTurn } from './helpers.js';
import { highlightLastMove } from './highlight.js';
import { updateStatus, gameStart } from './update.js';
import { otherChoices, resetMoveVars, decMoveNum, makeComputerMove } from './move.js';

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
    resetBoard();
    $('#keepPlayingBtn')[0].style.display = 'none';
    var difLineBtn = document.getElementById('difLineBtn');
    difLineBtn.innerHTML = 'Different Line';
    difLineBtn.disabled = false;
    resetMoveVars();
    gameStart();
    window.setTimeout(makeComputerMove, 500);
});
  
$('#difLineBtn').on('click', function () {
    if (!otherChoices) {
        console.log('No other lines were available');
    } else {
        console.log('Different line chosen');
        console.log('----------------------------------------------------');
        if (oppTurn()) {
            game.undo();
        };
        if (game.turn() == 'w') {
            decMoveNum();
        };
        game.undo();
        board.position(game.fen(), false);
        setFinished(false);
        $('#keepPlayingBtn')[0].style.display = 'none';
        setPossibleMoves(otherChoices);
        this.disabled = true;
        window.setTimeout(makeComputerMove, 500);
    };
});

$('#switchBtn').on('click', function () {
    swapBoard();
    highlightLastMove();
    window.setTimeout(makeComputerMove, 500);
    timeoutBtn(this);
});

$('#evalBarBtn').on('click', function () {
    this.innerHTML = this.innerHTML == 'Show Eval' ? 'Hide Eval' : 'Show Eval';
    evalBar.hidden = !evalBar.hidden;
});

$('#hintBtn').on('click', function () {
    this.innerHTML = this.innerHTML == 'Show Hints' ? 'Hide Hints' : 'Show Hints';
    var hintElement = document.getElementById('hints');
    hintElement.hidden = !hintElement.hidden;
});

$('#keepPlayingBtn').on('click', function () {
    this.style.display = 'none';
    setFinished(false);
    setKeepPlaying(true);
    updateStatus();
    document.getElementById('evalBarBtn').click();
    document.getElementById('hintBtn').click();
    window.setTimeout(makeComputerMove, 500);
});