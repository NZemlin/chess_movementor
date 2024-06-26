import { config, game, isOppTurn, swapBoard, resetBoard } from './game.js';
import { copyBtn, restartBtn, difLineBtn, limitLineBtn, swapBtn,
         evalBarBtn, lineBtn, hintBtn, keepPlayingBtn, blitzBtn, moveArrowBtn } from './buttons.js';
import { pgn, otherChoices, isBlitzing, freePlay, curEval, setLastFen,
         setPossibleMoves, setFinished, setKeepPlaying, setIsBlitzing,
         setLimitedLineId, setEngineLevel, modPreMoves } from './globals.js';
import { practice, study, drill, edit, startPosition, startElement, computerPauseTime } from './constants.js';
import { scrollIfNeeded, resizeCols } from './visual_helpers.js';
import { timeoutBtn, resetButtons, resetMoveList, findClosestSmallerElementId } from './page_helpers.js';
import { getSelected, getPlayedSelected, getUnderscoredFen, getBoardFen } from './getters.js';
import { drawArrows } from './arrow.js';
import { highlightLastMove, highlightRightClickedSquares, setHighlightedSquares, modRightClickedSquares } from './highlight.js';
import { updateBoard, updateGameState, gameStart } from './update.js';
import { setFinishedLimitedLine, makeComputerMove } from './move.js';
import { playMoveSelf, playMoveOpponent, playSound } from './sounds.js';
import { displayEvaluation, tryEvaluation } from './eval.js';
import { createNewEngine } from './eval_helpers.js';
import { addListeners } from './listeners.js';
import { updateCapturedPieces } from './captured_pieces.js';
import { loadRandomDrill, limitDrillLine, limitingDrillLine } from './drill.js';
import { setAddedLastMove } from './edit.js';

export var lastKeyCode;

copyBtn.on('click', function() {
    if (this.innerHTML == 'Copied') return;
    var text = practice ? game.pgn() : pgn;
    navigator.clipboard.writeText(text);
    this.innerHTML = 'Copied';
    window.setTimeout(function() {
        copyBtn[0].innerHTML = 'Copy PGN';
    }, 1000);
});

restartBtn.on('click', function() {
    // console.clear();
    resetMoveList();
    resetBoard();
    resetButtons();
    setHighlightedSquares();
    modRightClickedSquares();
    if (practice) modPreMoves('clear');
    gameStart();
    timeoutBtn(this, .1);
    setFinishedLimitedLine(false);
    if (practice) window.setTimeout(makeComputerMove, computerPauseTime);
});
  
difLineBtn.on('click', function () {
    // console.log('Different line chosen');
    // console.log('----------------------------------------------------');
    modPreMoves('clear');
    if (isOppTurn()) game.undo();
    game.undo();
    updateBoard(game.fen(), false);
    setFinished(false);
    $('#keepPlayingBtn')[0].style.display = 'none';
    setPossibleMoves(otherChoices);
    this.disabled = true;
    limitLineBtn[0].disabled = true;
    window.setTimeout(makeComputerMove, computerPauseTime);
});

limitLineBtn.on('click', function () {
    if (drill) {
        if (this.innerHTML == 'Limit Line') {
            this.innerHTML = 'Set Line';
            limitDrillLine();
        } else if (this.innerHTML == 'Set Line') {
            this.innerHTML = 'Any Line';
            limitDrillLine();
        } else {
            this.innerHTML = 'Limit Line';
            loadRandomDrill('reset');
        };
    } else {
        this.innerHTML = this.innerHTML == 'Limit Line' ? 'Any Line' : 'Limit Line';
        setLimitedLineId((this.innerHTML == 'Any Line') ? getSelected().id : '');
        restartBtn[0].click();
    };
    timeoutBtn(this, .1);
});

swapBtn.on('click', function () {
    if (practice) modPreMoves('clear');
    swapBoard();
    if (drill && !limitingDrillLine) loadRandomDrill();
    if ((practice || limitingDrillLine) && getBoardFen() == getUnderscoredFen()) window.setTimeout(makeComputerMove, computerPauseTime);
    timeoutBtn(this);
});

evalBarBtn.on('click', function () {
    this.innerHTML = this.innerHTML == 'Show Eval' ? 'Hide Eval' : 'Show Eval';
    var evalBar = document.getElementById('evalBar');
    evalBar.style.visibility = evalBar.style.visibility == 'hidden' ? 'visible' : 'hidden';
    displayEvaluation(curEval);
    timeoutBtn(this, .1);
});

lineBtn.on('click', function () {
    this.innerHTML = (this.innerHTML == 'Show Lines') ? 'Hide Lines' : 'Show Lines';
    var linesTable = document.getElementsByClassName('lines-table')[0];
    if (linesTable.hidden) {
        linesTable.hidden = !linesTable.hidden;
        var linesTableHeight = -linesTable.offsetHeight - 13;
    } else {
        var linesTableHeight = linesTable.offsetHeight + 13;
        linesTable.hidden = !linesTable.hidden;
    };
    var containerName = (!practice) ? 'moves-container-study' : 'move-list-container';
    var container = document.getElementsByClassName(containerName)[0];
    if (study) container.style.maxHeight = container.offsetHeight + linesTableHeight + 'px';
    else {
        container.style.height = parseInt(container.style.height.slice(0, -2)) + linesTableHeight + 'px';
        container.style.maxHeight = parseInt(container.style.height.slice(0, -2)) - 28 + (freePlay ? 30 : 0) + 'px';
    };
    timeoutBtn(this, .1);
});

hintBtn.on('click', function () {
    this.innerHTML = this.innerHTML == 'Show Hints' ? 'Hide Hints' : 'Show Hints';
    var hintElement = document.getElementById('hints');
    hintElement.hidden = !hintElement.hidden;
    timeoutBtn(this, .1);
});

keepPlayingBtn.on('click', function () {
    setEngineLevel();
    $('#skill-label')[0].style.display = 'none';
    $('#skill-input')[0].style.display = 'none';
    this.style.display = 'none';
    difLineBtn[0].style.display = 'none';
    limitLineBtn[0].style.display = 'none';
    setFinished(false);
    setKeepPlaying(true);
    setAddedLastMove(false);
    updateGameState();
    if (evalBarBtn[0].innerHTML == 'Hide Eval') evalBarBtn[0].click();
    if (lineBtn[0].innerHTML == 'Hide Lines') lineBtn[0].click();
    if (hintBtn[0].innerHTML == 'Hide Hints') hintBtn[0].click();
    createNewEngine();
    window.setTimeout(makeComputerMove, computerPauseTime);
});

blitzBtn.on('click', function () {
    this.innerHTML = isBlitzing ? 'Blitz: Off' : 'Blitz: On';
    setIsBlitzing(!isBlitzing);
    timeoutBtn(this, .1);
});

moveArrowBtn.on('click', function () {
    this.innerHTML = this.innerHTML == 'Show Moves' ? 'Hide Moves' : 'Show Moves';
    drawArrows();
    timeoutBtn(this, .1);
});

export function whichCheckKey() {
    if (practice) return checkKeyPractice;
    else if (study || edit) return checkKeyStudy;
    else return;
};

export function whichClickUpdate(element) {
    if (practice) return clickUpdatePractice(element);
    else if (study || edit) return clickUpdateStudy(element);
    else return;
};

export function clickUpdatePractice(element) {
    modPreMoves('clear');
    var curPosition = element.getAttribute('data-fen').replace(/_/g, ' ');
    updateBoard(curPosition, false);
    playSound(element.innerHTML);
    getPlayedSelected().classList.remove('played-selected');
    element.classList.add('played-selected');
    var latestMove = getBoardFen() == getUnderscoredFen();
    highlightLastMove(element.getAttribute('data-source'), element.getAttribute('data-target'));
    tryEvaluation();
    highlightRightClickedSquares();
    drawArrows();
    scrollIfNeeded(element);
    keepPlayingBtn[0].disabled = !latestMove;
    difLineBtn[0].disabled = (!latestMove || otherChoices.length == 0);
    updateCapturedPieces();
    if (latestMove) window.setTimeout(makeComputerMove, computerPauseTime);
};

export function checkKeyPractice(e) {
    lastKeyCode = e.keyCode;
    var firstMove = document.getElementById('w1');
    if (firstMove.style.visibility == 'hidden') return;
    var old = getPlayedSelected();
    if (e.keyCode == 37) {
        if (old == startElement()) return;
        else if (old == firstMove) clickUpdatePractice(startElement());
        else clickUpdatePractice(document.getElementById(old.getAttribute('data-prev-move')));
    } else if (e.keyCode == 39) {
        var nextMove = (old == startElement()) ? firstMove : document.getElementById(old.getAttribute('data-next-move'));
        if (nextMove.style.visibility != 'visible') return;
        clickUpdatePractice(nextMove);
    };
};

export function nearestMainlineParent(element) {
    let stop = false;
    let color = element.getAttribute('data-color');
    let turn = element.getAttribute('data-turn');
    while (!stop) {
        var fen = element.getAttribute('data-parent');
        let elements = document.querySelectorAll("[data-own='" + fen + "']");
        element = findClosestSmallerElementId(parseInt(element.id), elements); 
        stop = (element.getAttribute('data-variation-start') === 'true' ||
                element.getAttribute('data-mainline') === 'true') &&
                ((color != element.getAttribute('data-color')) ||
                 (turn != element.getAttribute('data-turn')));
    };
    return element;
};

export function nearestRealParent(element) {
    if (element.id == '0') return document.getElementById(startElement());
    let color = element.getAttribute('data-color');
    while (true) {
        var fen = element.getAttribute('data-parent');
        let elements = document.querySelectorAll("[data-own='" + fen + "']");
        if (elements.length > 1) element = findClosestSmallerElementId(parseInt(element.id), elements);
        else element = elements[0];
        if (color != element.getAttribute('data-color')) break;
    };
    return element;
};

function returnToStart() {
    game.load(startPosition.replace(/_/g, ' '));
    updateBoard(game.fen(), false);
    highlightRightClickedSquares();
    drawArrows();
    setAddedLastMove(false);
    updateGameState('', '', '', true);
    startElement().classList.add('selected');
    document.getElementById('comment').innerHTML = 'Comment:';
    (config.orientation == 'w') ? playMoveOpponent() : playMoveSelf();
    return startPosition;
};

function requestedFen(keyCode, old) {
    var fen, msg;
    switch (keyCode) {
        case 32:
            if (old == document.getElementById('0')) fen = returnToStart();
            else fen = nearestMainlineParent(getSelected()).getAttribute('data-own');
            msg = 'No parent to current selected move';
            break;
        case 37:
            if (old == document.getElementById('0')) fen = returnToStart();
            else fen = nearestRealParent(getSelected()).getAttribute('data-own');
            msg = 'No parent to current selected move';
            break;
        case 38:
            if (old == document.getElementById('0')) fen = returnToStart();
            else fen = old.getAttribute('data-parent');
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
    updateBoard(game.fen(), false);
    highlightRightClickedSquares();
    scrollIfNeeded(element);
    var uci = element.getAttribute('data-uci');
    setKeepPlaying(false);
    setAddedLastMove(false);
    updateGameState(element.getAttribute('data-san'), uci.slice(0, 2), uci.slice(2, 4), false, false, (element != null ? element.id : null));
    updateCapturedPieces();
    var comment = element.getAttribute('data-comment').replace(/_/g, ' ');
    if (study) document.getElementById('comment').innerHTML = 'Comment:' + ((comment != 'none') ? ' ' + comment : '');
    if (edit) document.getElementById('comment').value = comment != 'none' ? comment : '';
};

export function checkKeyStudy(e) {
    lastKeyCode = e.keyCode;
    var old = document.getElementsByClassName('selected');
    if (old.length == 0 || old[0] == startElement()) {
        if (e.keyCode == '39') {
            clickUpdateStudy(document.getElementById('0'));
        } else return;
    } else {
        var result = requestedFen(e.keyCode, old[0]);
        if (result[0] == startPosition || result[0] == null) return;
        var element = document.querySelectorAll("[data-own='" + result[0] + "']");
        if (element[0] != old[0]) clickUpdateStudy(element[0]);
        // } else console.log(result[1]);
    };
};

if (practice) {
    moveArrowBtn[0].style.display = 'none';
    if (freePlay) {
        evalBarBtn[0].click();
        lineBtn[0].click();
        document.getElementsByClassName('practice-buttons')[0].style.display = 'none';
        keepPlayingBtn[0].innerHTML = 'Play';
    };
};
resizeCols();
addListeners();