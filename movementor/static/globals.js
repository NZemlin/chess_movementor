import { Chess } from 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.13.4/chess.js';
import { toggleDifLineBtn, addRightClickListeners } from './helpers.js';
import { highlightLastMove, clearRightClickHighlights, highlightRightClickedSquares } from './highlight.js';
import { onDragStart, onDrop, onSnapEnd } from './move.js';
import { updateEvalBar, gameStart } from './update.js';
import { swapCapturedPieces } from './captured_pieces.js';

export var page = document.getElementById('page').getAttribute('data-page');
export var startPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR_w_KQkq_-_0_1';
export var startElement = document.getElementById('-1');
export var squareClass = 'square-55d63';
export var lastFen = startPosition;
export var possibleMoves = [];
export var otherChoices = [];
export var finished = false;
export var keepPlaying = false;
export var movementAllowed = true;
export var highlightedSquares = [];
export var rightClickedSquares = [];
export var config = {
    draggable: true,
    dropOffBoard: 'snapback',
    position: 'start',
    orientation: 'white',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
};
export var board = Chessboard('myBoard', config);
export var game = new Chess();

export function setLastFen(fen=startPosition) {
    lastFen = fen;
};

export function setPossibleMoves(moves) {
    possibleMoves = moves;
    toggleDifLineBtn(otherChoices.length == 0);
    finished = false;
};

export function setOtherChoices(moves, index) {
    otherChoices = moves;
    otherChoices.splice(index, 1);
    toggleDifLineBtn(otherChoices.length == 0);
    if (otherChoices.length != 0) console.log('Other choices were: ' + otherChoices.join(', '));
};

export function setFinished(done) {
    finished = done;
};

export function declareFinished() {
    document.getElementById('status').innerHTML = 'This line is finished';
    setFinished(true);
    if (page == 'practice') $('#keepPlayingBtn')[0].style.display = 'block';
};

export function setKeepPlaying(cont) {
    keepPlaying = cont;
};

export function setMovementAllowed(allowed) {
    movementAllowed = allowed;
};

export function setHighlightedSquares(squares=[]) {
    highlightedSquares = squares;
};

export function modRightClickedSquares(square='', add=true) {
    if (!square) rightClickedSquares = [];
    else {
        if (add && !rightClickedSquares.includes(square)) rightClickedSquares.push(square);
        else if (rightClickedSquares.includes(square)) {
            var index = rightClickedSquares.indexOf(square);
            rightClickedSquares.splice(index, 1);
        };
    };
};

export function swapBoard() {
    config.orientation = (config.orientation == 'white' ? 'black' : 'white');
    config.position = game.fen();
    board = Chessboard('myBoard', config);
    addRightClickListeners();
    highlightLastMove();
    highlightRightClickedSquares();
    swapCapturedPieces();
    updateEvalBar();
};

export function resetBoard() {
    finished = false;
    keepPlaying = false;
    config.position = 'start';
    board = Chessboard('myBoard', config);
    game = new Chess();
    addRightClickListeners();
    setLastFen();
};

document.addEventListener('mousedown', e => {
    var ignore = document.getElementsByClassName('ignore');
    if ((Array.from(ignore)).includes(e.target)) return;
    if (e.button == 0) clearRightClickHighlights();
});

document.addEventListener('contextmenu', e => {
    e.preventDefault();
});

gameStart();