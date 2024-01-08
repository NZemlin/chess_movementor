import { lastFen, finished, keepPlaying, config, game, setPossibleMoves, setFinished, updateFen, elementInViewport } from './globals.js';
import { page } from './move.js';
import { highlightLastMove } from './highlight.js';
import { updateCapturedPieces } from './captured_pieces.js';
import * as sounds from './sounds.js';

function updateSelectedMoveElement() {
    if (game.fen().replace(/ /g, '_') != lastFen) {
        console.log('Updating selected move element');
        var old = document.getElementsByClassName('selected');
        if (old.length != 0) {
            old[0].classList.remove('selected');
        };
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
    var curMoves = [];
    if (keepPlaying) {
        setPossibleMoves(game.moves());
        return;
    };
    if (!finished) {
        if (game.fen() == 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
            curMoves = [document.getElementById('0').getAttribute('data-san')];
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
    setPossibleMoves(curMoves);
};

function displayEvaluation(dataEval = '0.17') {
    let evalFloat = parseFloat(dataEval)
    let blackBar = document.querySelector(".blackBar");
    let blackBarHeight = 50 - (evalFloat/15)*100;
    blackBarHeight = blackBarHeight>100 ? (blackBarHeight=100) : blackBarHeight;
    blackBarHeight = blackBarHeight<0 ? (blackBarHeight=0) : blackBarHeight;
    blackBar.style.height = blackBarHeight + "%";
    let evalNum = document.querySelector(".evalNum");
    evalNum.innerHTML = dataEval;
}

export function updateStatus(move='', source='', target='') {
    console.log('Updating status');
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
            // getEvaluation(game.fen(), function(evaluations) {
            //     displayEvaluation(evaluations);
            // });
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
    console.log('----------------------------------------------------');
};