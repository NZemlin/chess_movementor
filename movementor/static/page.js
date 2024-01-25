import { config, board, game, isOppTurn, swapBoard, resetBoard } from './game.js';
import { otherChoices, setLastFen, setPossibleMoves, setFinished, setKeepPlaying, curEval } from './globals.js';
import { page, squareClass, startPosition, startElement } from './constants.js';
import { scrollIfNeeded } from './visual_helpers.js';
import { timeoutBtn, resetButtons } from './page_helpers.js';
import { resetMoveList } from './page_helpers.js';
import { getPlayedSelected, getUnderscoredFen, getBoardFen } from './getters.js';
import { drawArrows } from './arrow.js';
import { highlightLastMove, highlightRightClickedSquares, setHighlightedSquares, modRightClickedSquares } from './highlight.js';
import { updateGameState, gameStart } from './update.js';
import { makeComputerMove } from './move.js';
import { playMoveSelf, playMoveOpponent, playSound } from './sounds.js';
import { displayEvaluation, tryEvaluation } from './eval.js';
import { createNewEngine } from './eval_helpers.js';
import { addListeners } from './listeners.js';
import { updateCapturedPieces } from './captured_pieces.js';

export var lastKeyCode;

$('#copyBtn').on('click', function() {
    var text = (page == 'study') ? game.fen() : game.pgn();
    navigator.clipboard.writeText(text);
    timeoutBtn(this, .1);
});

$('#restartBtn').on('click', function() {
    console.clear();
    resetMoveList();
    resetBoard();
    resetButtons();
    setHighlightedSquares();
    modRightClickedSquares();
    gameStart();
    timeoutBtn(this, .1);
    window.setTimeout(makeComputerMove, 500);
});
  
$('#difLineBtn').on('click', function () {
    if (!otherChoices) console.log('No other lines were available');
    else {
        console.log('Different line chosen');
        console.log('----------------------------------------------------');
        if (isOppTurn()) game.undo();
        game.undo();
        board.position(game.fen(), false);
        setFinished(false);
        $('#keepPlayingBtn')[0].style.display = 'none';
        setPossibleMoves(otherChoices);
        this.disabled = true;
        window.setTimeout(makeComputerMove, 500);
    };
});

$('#swapBtn').on('click', function () {
    swapBoard();
    if (page != 'study' && getBoardFen() == getUnderscoredFen()) window.setTimeout(makeComputerMove, 500);
    timeoutBtn(this);
});

$('#evalBarBtn').on('click', function () {
    this.innerHTML = this.innerHTML == 'Show Eval' ? 'Hide Eval' : 'Show Eval';
    var evalBar = document.getElementById('evalBar');
    evalBar.style.visibility = evalBar.style.visibility == 'hidden' ? 'visible' : 'hidden';
    displayEvaluation(curEval);
    timeoutBtn(this, .1);
});

$('#lineBtn').on('click', function () {
    this.innerHTML = this.innerHTML == 'Show Lines' ? 'Hide Lines' : 'Show Lines';
    var linesTable = document.getElementsByClassName('lines-table')[0];
    if (linesTable.hidden) {
        linesTable.hidden = !linesTable.hidden;
        var linesTableHeight = -linesTable.offsetHeight - 14;
    } else {
        var linesTableHeight = linesTable.offsetHeight + 14;
        linesTable.hidden = !linesTable.hidden;
    };
    var containerName = (page == 'study') ? 'moves-container-study' : 'move-list-container';
    var container = document.getElementsByClassName(containerName)[0];
    if (page == 'study') container.style.maxHeight = container.offsetHeight + linesTableHeight + 'px';
    else {
        container.style.height = parseInt(container.style.height.slice(0, -2)) + linesTableHeight + 'px';
        container.style.maxHeight = container.style.height;
    };
    timeoutBtn(this, .1);
});

$('#hintBtn').on('click', function () {
    this.innerHTML = this.innerHTML == 'Show Hints' ? 'Hide Hints' : 'Show Hints';
    var hintElement = document.getElementById('hints');
    hintElement.hidden = !hintElement.hidden;
    timeoutBtn(this, .1);
});

$('#keepPlayingBtn').on('click', function () {
    $('#skill-label')[0].style.display = 'none';
    $('#skill-input')[0].style.display = 'none';
    this.style.display = 'none';
    setFinished(false);
    setKeepPlaying(true);
    updateGameState();
    document.getElementById('evalBarBtn').click();
    document.getElementById('lineBtn').click();
    document.getElementById('hintBtn').click();
    createNewEngine();
    window.setTimeout(makeComputerMove, 500);
});

export function whichCheckKey() {
    return (page == 'practice') ? checkKeyPractice : checkKeyStudy;
};

export function whichClickUpdate(element) {
    return (page == 'practice') ? clickUpdatePractice(element) : clickUpdateStudy(element);
};

export function clickUpdatePractice(element) {
    var curPosition = element.getAttribute('data-fen').replace(/_/g, ' ');
    board.position(curPosition, false);
    playSound(element.innerHTML);
    getPlayedSelected().classList.remove('played-selected');
    element.classList.add('played-selected');
    var latestMove = getBoardFen() == getUnderscoredFen();
    document.getElementById('difLineBtn').disabled = !latestMove;
    highlightLastMove(element.getAttribute('data-source'), element.getAttribute('data-target'));
    tryEvaluation();
    highlightRightClickedSquares();
    drawArrows();
    scrollIfNeeded(element);
    $('#keepPlayingBtn')[0].disabled = !latestMove;
    updateCapturedPieces();
    if (latestMove) window.setTimeout(makeComputerMove, 500);
};

export function checkKeyPractice(e) {
    lastKeyCode = e.keyCode;
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
            (config.orientation == 'w') ? playMoveOpponent() : playMoveSelf();
            tryEvaluation();
            return;
        };
        clickUpdatePractice(document.getElementById(old.getAttribute('data-prev-move')));
    } else if (e.keyCode == 39) {
        var nextMove = (old == startElement) ? firstMove : document.getElementById(old.getAttribute('data-next-move'));
        if (nextMove.style.visibility != 'visible') return;
        clickUpdatePractice(nextMove);
    };
};

function nearestMainlineParent(element) {
    var stop = element.getAttribute('data-mainline') === 'true';
    while (!stop) {
        var fen = element.getAttribute('data-parent');
        element = document.querySelectorAll("[data-own='" + fen + "']")[0];
        stop = (element.getAttribute('data-mainline') === 'true' ||
                element.getAttribute('data-variation-start') === 'true');
    };
    return [element];
};

function requestedFen(keyCode, old) {
    var fen, msg;
    switch (keyCode) {
        case 32:
        case 37:
        case 38:
            if (old == document.getElementById('0')) {
                fen = startPosition;
                game.load(fen.replace(/_/g, ' '));
                board.position(game.fen(), false);
                highlightRightClickedSquares();
                drawArrows();
                updateGameState('', '', '', true);
                startElement.classList.add('selected');
                (config.orientation == 'w') ? playMoveOpponent() : playMoveSelf();
            } else fen = old.getAttribute('data-parent');
            msg = 'No parent to current selected move';
            break;
        case 39:
            fen = old.getAttribute('data-child-1');
            msg = 'No mainline child to current selected move';
            break;
        case 40:
            fen = old.getAttribute('data-child-2');
            msg = 'No variation to current selected move';
            break;
        default:
            fen = null;
            msg = '';
            break;
    };
    return [fen, msg];
};

export function clickUpdateStudy(element) {
    if (element == document.getElementsByClassName('selected')[0]) return;
    setLastFen(element.getAttribute('data-parent'));
    game.load(element.getAttribute('data-own').replace(/_/g, ' '));
    board.position(game.fen(), false);
    highlightRightClickedSquares();
    drawArrows();
    scrollIfNeeded(element);
    var uci = element.getAttribute('data-uci');
    setKeepPlaying(false);
    updateGameState(element.getAttribute('data-san'), uci.slice(0, 2), uci.slice(2, 4));
    updateCapturedPieces();
};

export function checkKeyStudy(e) {
    lastKeyCode = e.keyCode;
    var old = document.getElementsByClassName('selected');
    if (old.length == 0 || old[0] == startElement) {
        if (e.keyCode == '39') {
            clickUpdateStudy(document.getElementById('0'));
        } else return;
    } else {
        var result = requestedFen(e.keyCode, old[0]);
        if (result[0] == startPosition || result[0] == null) return;
        var element = document.querySelectorAll("[data-own='" + result[0] + "']");
        if (element[0] == old[0]) console.log(result[1]);
        else {
            if (e.keyCode == 32) element = nearestMainlineParent(element[0]);
            clickUpdateStudy(element[0]);
        };
    };
};

addListeners();