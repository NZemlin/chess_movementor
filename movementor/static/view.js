import { config, board, game, setLastFen, setFinished, setBoard, updateFen, elementInViewport } from './globals.js';
import { updateEvalColors, updateStatus } from './update.js';
import { swapCapturedPieces } from './captured_pieces.js';

$('#switchBtn').on('click', function () {
    config.orientation = config.orientation == 'white' ? 'black' : 'white';
    config.position = game.fen();
    swapCapturedPieces();
    setBoard();
    updateEvalColors();
});

function nearestMainlineParent(element) {
    var mainline = element[0].getAttribute('data-mainline') === 'true';
    while (!mainline) {
        fen = element[0].getAttribute('data-parent');
        element = document.querySelectorAll("[data-own='" + fen + "']");
        mainline = element[0].getAttribute('data-mainline') === 'true';
    };
    return element;
};

function clickUpdate(element) {
    if (element == document.getElementsByClassName('selected')[0]) {
        return;
    };
    setLastFen(element.getAttribute('data-parent'));
    setFinished(element.getAttribute('data-own') == element.getAttribute('data-child-1'));
    game.load(element.getAttribute('data-own').replace(/_/g, ' '));
    board.position(game.fen(), false);
    var uci = element.getAttribute('data-uci');
    updateStatus(element.getAttribute('data-san'), uci.slice(0, 2), uci.slice(2, 4));
};

function checkKey(e) {
    var old = document.getElementsByClassName('selected');
    if (old.length == 0 && (e.keyCode == '37' || e.keyCode == '38' || e.keyCode == '39' || e.keyCode == '40')) {
        clickUpdate(document.getElementById('0'));
    }
    else {
        var fen;
        switch (e.keyCode) {
            case 32:
            case 37:
            case 38:
                fen = old[0].getAttribute('data-parent');
                break;
            case 39:
                fen = old[0].getAttribute('data-child-1');
                break;
            case 40:
                fen = old[0].getAttribute('data-child-2');
                break;
            default:
                fen = null;
                break;
        };
        if (fen != null) {
            var element = document.querySelectorAll("[data-own='" + fen + "']");
            if (element.length == 0) {
                switch (e.keyCode) {
                    case 32:
                    case 37:
                    case 38:
                        console.log('No parent to current selected move');
                        break;
                    case 39:
                        console.log('No mainline child to current selected move');
                        break;
                    case 40:
                        console.log('No variation to current selected move');
                        break;
                };
            }
            else {
                if (e.keyCode == 32) {
                    element = nearestMainlineParent(element[0]);
                };
                clickUpdate(element[0]);
            };
        };
    };
};

function dontScroll(e) {
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    };
};

document.onkeydown = checkKey;

window.addEventListener("keydown", dontScroll, false);

var moves = document.getElementsByClassName('move');
for (let i = 0; i < moves.length; i++) {
    moves[i].addEventListener('click', function() {
        clickUpdate(moves[i]);
    });
};