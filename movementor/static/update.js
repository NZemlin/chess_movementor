import { page, possibleMoves, keepPlaying, config, game, setPossibleMoves, declareFinished } from './globals.js';
import { scrollIfNeeded, addRightClickListeners, playSound, lastMoveElement, nextMoveColor, getPlayedSelected, getSelected } from './helpers.js';
import { highlightLastMove } from './highlight.js';
import { removeCapturedPieces, updateCapturedPieces } from './captured_pieces.js';

function updateSelectedMoveElement() {
    if (keepPlaying) return;
    // console.log('Updating selected move element');
    var old = document.getElementsByClassName('selected');
    if (old.length != 0) old[0].classList.remove('selected');
    var element = lastMoveElement();
    element.classList.add('selected');
    if (page == 'view') scrollIfNeeded(element);
};

function updateAllowedMoves() {
    // console.log('Updating allowed moves');
    if (keepPlaying) {
        setPossibleMoves(game.moves());
        return;
    };
    var curMoves = [];
    var element = lastMoveElement();
    var fen = element.getAttribute('data-child-1');
    if (fen == element.getAttribute('data-own')) {
        declareFinished();
        return;
    };
    element = document.querySelectorAll("[data-own='" + fen + "']")[0];
    curMoves.push(element.getAttribute('data-san'));
    if (lastMoveElement().getAttribute('data-own') == lastMoveElement().getAttribute('data-child-2')) {
        setPossibleMoves(curMoves);
        return;
    };
    fen = lastMoveElement().getAttribute('data-child-2');
    while (fen != element.getAttribute('data-own')) {
        element = document.querySelectorAll("[data-own='" + fen + "']")[0];
        if (game.turn() != element.getAttribute('data-color')[0]) break;
        curMoves.push(element.getAttribute('data-san'));
        fen = element.getAttribute('data-child-2');
    };
    setPossibleMoves(curMoves);
};

export function updateHintText(own='') {
    if (page == 'view') return;
    document.getElementById('hints').innerHTML = (possibleMoves && own) ? ('Allowed moves are: ' + possibleMoves.join(', ')) : 'No hints currently';
};

function displayEvaluation(dataEval = '0.22') {
    var evalFloat = parseFloat(dataEval);
    var blackBarHeight = 50 + ((config.orientation == 'white') ? -(evalFloat/15)*100 : (evalFloat/15)*100);
    blackBarHeight = blackBarHeight>100 ? (blackBarHeight=100) : blackBarHeight;
    blackBarHeight = blackBarHeight<0 ? (blackBarHeight=0) : blackBarHeight;
    document.querySelector(".blackBar").style.height = blackBarHeight + "%";

    var evalPopup = document.querySelector(".eval-pop-up");
    var evalNumOwn = document.querySelector(".evalNumOwn");
    var evalNumOpp = document.querySelector(".evalNumOpp");
    var sign;
    if (evalFloat > 0 && config.orientation == 'black' ||
        evalFloat < 0 && config.orientation == 'white') {
        evalPopup.style.backgroundColor = '#403d39';
        evalPopup.style.color = 'white';
        evalPopup.style.border = 'none';
        evalNumOpp.style.visibility = 'visible';
        evalNumOwn.style.visibility = 'hidden';
        sign = '-';
    } else {
        evalPopup.style.backgroundColor = 'white';
        evalPopup.style.color = 'black';
        evalPopup.style.border = '1px solid lightgray';
        evalNumOwn.style.visibility = 'visible';
        evalNumOpp.style.visibility = 'hidden';
        sign = '+';
    };
    evalFloat = (evalFloat > 0) ? evalFloat : -evalFloat;

    evalNumOwn.style.color = (config.orientation == 'white') ? '#403d39' : 'white';
    evalNumOwn.innerHTML = evalFloat.toFixed(1);

    evalNumOpp.style.color = (config.orientation == 'white') ? 'white' : '#403d39';
    evalNumOpp.innerHTML = evalFloat.toFixed(1);

    evalPopup.innerHTML = sign + evalFloat.toFixed(2);
};

export function updateEvalBar() {
    var blackBar = document.querySelector(".blackBar");
    var evalBar = document.querySelector("#evalBar");
    blackBar.style.backgroundColor = (config.orientation == 'white') ? '#403d39' : 'white';
    evalBar.style.backgroundColor = (config.orientation == 'white') ? 'white' : '#403d39';
    var element = (page == 'practice') ? getPlayedSelected() : getSelected();
    displayEvaluation(element.getAttribute('data-eval'));
};

function updateStatus() {
    // console.log('Updating status');
    var nextColor = nextMoveColor().charAt(0).toUpperCase() + nextMoveColor().slice(1);
    var status = nextColor + ' to move';
    if (game.in_checkmate()) status = 'Game over, ' + nextColor + ' is in checkmate.';
    else if (game.in_draw()) status = 'Game over, drawn position';
    else if (game.in_check()) status += ', ' + nextColor + ' is in check';
    document.getElementById('status').innerHTML = status;
};

export function updateGameState(move='', source='', target='', mute=false) {
    if (!mute) playSound(move);
    highlightLastMove(source, target);
    updateSelectedMoveElement();
    updateCapturedPieces();
    updateAllowedMoves();
    updateHintText();
    updateEvalBar();
    updateStatus();
    // console.log('Game state updated')
    if (page == 'practice') console.log('----------------------------------------------------');
};

export function gameStart() {
    addRightClickListeners();
    playSound();
    removeCapturedPieces();
    setPossibleMoves([document.getElementById('0').getAttribute('data-san')]);
    updateEvalBar();
    updateStatus();
    console.log('Game started');
    if (page == 'practice') console.log('----------------------------------------------------');
};