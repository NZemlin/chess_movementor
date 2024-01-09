import { startPosition, finished, keepPlaying, config, game, setPossibleMoves, setFinished, updateFen, elementInViewport } from './globals.js';
import { page } from './move.js';
import { highlightLastMove } from './highlight.js';
import { updateCapturedPieces } from './captured_pieces.js';
import * as sounds from './sounds.js';

function updateSelectedMoveElement() {
    console.log('Updating selected move element');
    var old = document.getElementsByClassName('selected');
    if (old.length != 0) {
        old[0].classList.remove('selected');
    };
    if (game.fen().replace(/ /g, '_') != startPosition) {
        var element = document.querySelectorAll("[data-own='" + updateFen(game.fen()).replace(/ /g, '_') + "']");
        if (element.length != 0) {
            element[0].classList.add('selected');
        };
        if (page == 'view') {
            if (!elementInViewport(element[0])) {
                element[0].scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'nearest',
                });
            };
        };
    };
};

function updateAllowedMoves() {
    console.log('Updating allowed moves');
    var nextMoveColor = game.turn() === 'w' ? 'white' : 'black';
    var curMoves = [];
    if (keepPlaying) {
        if (nextMoveColor != config.orientation) {
            var difLineBtn = document.getElementById('difLineBtn');
            difLineBtn.innerHTML = game.moves().length > 1 ? 'Different Line' : 'No Other Lines';
        };
        setPossibleMoves(game.moves());
        return;
    };
    if (!finished) {
        if (game.fen() == 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
            curMoves = [document.getElementById('0').getAttribute('data-san')];
            if (nextMoveColor != config.orientation) {
                var difLineBtn = document.getElementById('difLineBtn');
                difLineBtn.innerHTML = curMoves.length > 1 ? 'Different Line' : 'No Other Lines';
            };
            setPossibleMoves(curMoves);
            return;
        }
        else {
            var cur = document.querySelectorAll("[data-own='" + updateFen(game.fen()).replace(/ /g, '_') + "']")[0];
        };
        var fen = cur.getAttribute('data-child-1');
        var color = '';
        var turn = '';
        if (fen != null) {
            var element = document.querySelectorAll("[data-own='" + fen + "']");
            if (element[0].getAttribute('data-own') != cur.getAttribute('data-own')) {
                var move = element[0].getAttribute('data-san');
                curMoves.push(move);
                color = element[0].getAttribute('data-color');
                turn = element[0].getAttribute('data-turn');
            };
        };
        fen = cur.getAttribute('data-child-2');
        while (fen != null) {
            if (element[0].getAttribute('data-own') == fen) {
                break;
            }
            var element = document.querySelectorAll("[data-own='" + fen + "']");
            move = element[0].getAttribute('data-san');
            if (color == element[0].getAttribute('data-color') && turn == element[0].getAttribute('data-turn')) {
                curMoves.push(move);
                element = document.querySelectorAll("[data-own='" + fen + "']");
                fen = element[0].getAttribute('data-child-2');
            }
            else {
                break;
            };
        };
        if (curMoves.length == 0) {
            console.log('This line is finished');
            document.getElementById('status').innerHTML = 'This line is finished';
            setFinished(true);
            if (page == 'practice') {
                $('#keepPlayingBtn')[0].style.display = 'block';
            };
        };
    };
    if (nextMoveColor != config.orientation) {
        var difLineBtn = document.getElementById('difLineBtn');
        difLineBtn.innerHTML = curMoves.length > 1 ? 'Different Line' : 'No Other Lines';
    };
    setPossibleMoves(curMoves);
};

function displayEvaluation(dataEval = '0.17') {
    var evalFloat = parseFloat(dataEval);
    var blackBar = document.querySelector(".blackBar");
    var blackBarHeight = 50 + ((config.orientation == 'white') ? -(evalFloat/15)*100 : (evalFloat/15)*100);
    blackBarHeight = blackBarHeight>100 ? (blackBarHeight=100) : blackBarHeight;
    blackBarHeight = blackBarHeight<0 ? (blackBarHeight=0) : blackBarHeight;
    blackBar.style.height = blackBarHeight + "%";
    var evalNumOwn = document.querySelector(".evalNumOwn");
    var evalNumOpp = document.querySelector(".evalNumOpp");
    var evalPopup = document.querySelector(".eval-pop-up");
    var sign;
    evalNumOwn.style.color = (config.orientation == 'white') ? '#403d39' : 'white';
    evalNumOpp.style.color = (config.orientation == 'white') ? 'white' : '#403d39';
    if (evalFloat > 0 && config.orientation == 'black' ||
        evalFloat < 0 && config.orientation == 'white') {
        evalPopup.style.backgroundColor = '#403d39';
        evalPopup.style.color = 'white';
        evalPopup.style.border = 'none';
        evalNumOpp.style.visibility = 'visible';
        evalNumOwn.style.visibility = 'hidden';
        sign = '-';
    }
    else {
        evalPopup.style.backgroundColor = 'white';
        evalPopup.style.color = 'black';
        evalPopup.style.border = '1px solid lightgray';
        evalNumOwn.style.visibility = 'visible';
        evalNumOpp.style.visibility = 'hidden';
        sign = '+';
    };
    evalFloat = (evalFloat > 0) ? evalFloat : -evalFloat;
    evalNumOwn.innerHTML = evalFloat.toFixed(1);
    evalNumOpp.innerHTML = evalFloat.toFixed(1);
    evalPopup.innerHTML = sign + evalFloat.toFixed(2);
};

export function updateEvalColors() {
    var blackBar = document.querySelector(".blackBar");
    var evalBar = document.querySelector("#evalBar");
    blackBar.style.color = (config.orientation == 'white') ? '#403d39' : 'white';
    evalBar.style.color = (config.orientation == 'white') ? 'white' : '#403d39';
    var cur_eval = '0.17';
    var element = document.getElementsByClassName('selected');
    if (element.length != 0) {
        cur_eval = element[0].getAttribute('data-eval');
    };
    displayEvaluation(cur_eval);
};

export function updateStatus(move='', source='', target='') {
    if (page == 'practice' && !finished) {
        var hintElement = document.getElementById('hints');
        hintElement.innerHTML = 'No hints currently';
    };

    var status = '';

    var nextMoveColor = game.turn() === 'w' ? 'White' : 'Black';
    if (game.in_checkmate()) {
        sounds.playGameEnd();
        status = 'Game over, ' + nextMoveColor + ' is in checkmate.';
    }
    else if (game.in_draw()) {
        status = 'Game over, drawn position';
    }
    else if (game.in_check()) {
        sounds.playMoveCheck();
        status += ', ' + nextMoveColor + ' is in check';
    }
    else {
        if (move) {
            if (move[-2] == '=') {
                sounds.playPromote();
            }
            else if (move.includes('x')) {
                sounds.playCapture();
            }
            else if (move[0] == 'O') {
                sounds.playCastle();
            }
            else if (game.turn() == config.orientation) {
                sounds.playMoveSelf();
            }
            else {
                sounds.playMoveOpponent();
            }
            highlightLastMove(source, target);
        };
        status = nextMoveColor + ' to move';
        if (!finished) {
            document.getElementById('status').innerHTML = status;
        }
        else {
            document.getElementById('status').innerHTML = 'This line is finished';
            setFinished(true);
            if (page == 'practice') {
                $('#keepPlayingBtn')[0].style.display = 'block';
            };
        };
    };
    updateSelectedMoveElement();
    updateCapturedPieces();
    updateAllowedMoves();
    var element = document.getElementsByClassName('selected');
    var dataEval = element.length != 0 ? element[0].getAttribute('data-eval') : '0.17'
    displayEvaluation(dataEval);
    console.log('Status updated');
    console.log('----------------------------------------------------');
};