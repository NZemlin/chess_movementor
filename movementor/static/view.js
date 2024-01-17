import { startPosition, startElement, config, board, game, setLastFen, swapBoard, resetBoard } from './globals.js';
import { timeoutBtn } from './helpers.js';
import { updateGameState } from './update.js';
import { playMoveSelf, playMoveOpponent } from './sounds.js';

$('#switchBtn').on('click', function () {
    swapBoard();
    timeoutBtn(this);
});

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

function clickUpdate(element) {
    if (element == document.getElementsByClassName('selected')[0]) return;
    setLastFen(element.getAttribute('data-parent'));
    game.load(element.getAttribute('data-own').replace(/_/g, ' '));
    board.position(game.fen(), false);
    var uci = element.getAttribute('data-uci');
    updateGameState(element.getAttribute('data-san'), uci.slice(0, 2), uci.slice(2, 4));
};

function requestedFen(keyCode, old) {
    var fen, msg;
    switch (keyCode) {
        case 32:
        case 37:
        case 38:
            if (old == document.getElementById('0')) {
                fen = startPosition;
                resetBoard();
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

function checkKey(e) {
    var old = document.getElementsByClassName('selected');
    if (old.length == 0 || old[0] == startElement) {
        if (e.keyCode == '39') {
            clickUpdate(document.getElementById('0'));
        } else return;
    } else {
        var result = requestedFen(e.keyCode, old[0]);
        if (result[0] == startPosition || result[0] == null) return;
        var element = document.querySelectorAll("[data-own='" + result[0] + "']");
        if (element[0] == old[0]) console.log(result[1]);
        else {
            if (e.keyCode == 32) element = nearestMainlineParent(element[0]);
            clickUpdate(element[0]);
        };
    };
};

document.onkeydown = checkKey;

function dontScroll(e) {
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    };
};

window.addEventListener("keydown", dontScroll, false);

var moves = document.getElementsByClassName('move');
for (let i = 0; i < moves.length; i++) {
    moves[i].addEventListener('click', function() {
        clickUpdate(moves[i]);
    });
};