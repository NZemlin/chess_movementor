import { Chess } from 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.13.4/chess.js';
import { toggleDifLineBtn } from './helpers.js';
import { otherChoices, onDragStart, onDrop, onSnapEnd } from './move.js';
import { updateEvalBar, gameStart } from './update.js';
import { swapCapturedPieces } from './captured_pieces.js';

export var page = document.getElementById('page').getAttribute('data-page');
export var startPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR_w_KQkq_-_0_1';
export var lastFen = startPosition;
export var possibleMoves = [];
export var finished = false;
export var keepPlaying = false;
export var movementAllowed = true;
export var highlightedSquares = [];
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

export function setFinished(done) {
    finished = done;
};

export function declareFinished() {
    document.getElementById('status').innerHTML = 'This line is finished';
    setFinished(true);
    if (page == 'practice') {
        $('#keepPlayingBtn')[0].style.display = 'block';
    };
};

export function setKeepPlaying(cont) {
    keepPlaying = cont;
};

export function setMovementAllowed(allowed) {
    movementAllowed = allowed;
};

export function setHighlightedSquares(squares) {
    highlightedSquares = squares;
};

export function swapBoard() {
    config.orientation = (config.orientation == 'white' ? 'black' : 'white');
    config.position = game.fen();
    board = Chessboard('myBoard', config);
    swapCapturedPieces();
    updateEvalBar();
};

export function resetBoard() {
    finished = false;
    keepPlaying = false;
    config.position = 'start';
    board = Chessboard('myBoard', config);
    game = new Chess();
};

gameStart();