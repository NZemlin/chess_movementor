import { squareClass, startPosition, startElement, otherChoices, config, board, game, setPossibleMoves, setFinished, setKeepPlaying, swapBoard, resetBoard, setHighlightedSquares, modRightClickedSquares, drawArrows } from './globals.js';
import { scrollIfNeeded, timeoutBtn, resetMoveList, resetButtons, playSound, oppTurn, getPlayedSelected, getUnderscoredFen, getBoardFen } from './helpers.js';
import { highlightLastMove, highlightRightClickedSquares } from './highlight.js';
import { updateEvalBar, updateGameState, gameStart } from './update.js';
import { makeComputerMove } from './move.js';
import * as sounds from './sounds.js';

$('#pgnBtn').on('click', function() {
    var pgn = game.pgn();
    navigator.clipboard.writeText(pgn);
});

$('#restartBtn').on('click', function() {
    console.clear();
    resetMoveList();
    resetBoard();
    resetButtons();
    setHighlightedSquares();
    modRightClickedSquares();
    gameStart();
    window.setTimeout(makeComputerMove, 500);
});
  
$('#difLineBtn').on('click', function () {
    if (!otherChoices) console.log('No other lines were available');
    else {
        console.log('Different line chosen');
        console.log('----------------------------------------------------');
        if (oppTurn()) game.undo();
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
    if (getBoardFen() == getUnderscoredFen()) window.setTimeout(makeComputerMove, 500);
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
    updateGameState();
    document.getElementById('evalBarBtn').click();
    document.getElementById('hintBtn').click();
    window.setTimeout(makeComputerMove, 500);
});

function clickUpdate(element) {
    var curPosition = element.getAttribute('data-fen').replace(/_/g, ' ');
    board.position(curPosition, false);
    playSound(element.innerHTML);
    getPlayedSelected().classList.remove('played-selected');
    element.classList.add('played-selected');
    var latestMove = getBoardFen() == getUnderscoredFen();
    document.getElementById('difLineBtn').disabled = !latestMove;
    highlightLastMove(element.getAttribute('data-source'), element.getAttribute('data-target'));
    updateEvalBar();
    highlightRightClickedSquares();
    drawArrows();
    scrollIfNeeded(element);
    $('#keepPlayingBtn')[0].disabled = !latestMove;
    if (latestMove) window.setTimeout(makeComputerMove, 500);
};

function checkKey(e) {
    var firstMove = document.getElementById('w1');
    if (firstMove.style.visibility == 'hidden') return;
    var old = getPlayedSelected();
    if (e.keyCode == 37) {
        if (old == startElement) return;
        if (old == firstMove) {
            old.classList.remove('played-selected');
            startElement.classList.add('played-selected');
            board.position(startPosition.replace(/_/g, ' '), false);
            highlightRightClickedSquares();
            drawArrows();
            $('#myBoard').find('.' + squareClass).removeClass('highlight-light');
            $('#myBoard').find('.' + squareClass).removeClass('highlight-dark');
            (config.orientation == 'w') ? sounds.playMoveOpponent() : sounds.playMoveSelf();
            return;
        };
        clickUpdate(document.getElementById(old.getAttribute('data-prev-move')));
    } else if (e.keyCode == 39) {
        var nextMove = (old == startElement) ? firstMove : document.getElementById(old.getAttribute('data-next-move'));
        if (nextMove.style.visibility != 'visible') return;
        clickUpdate(nextMove);
    };
};

document.onkeydown = checkKey;

function dontScroll(e) {
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    };
};

window.addEventListener("keydown", dontScroll, false);

var moves = document.getElementsByClassName('played-move');
for (let i = 0; i < moves.length; i++) {
    moves[i].addEventListener('click', function() {
        clickUpdate(moves[i]);
    });
};