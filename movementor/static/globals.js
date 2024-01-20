import { Chess } from 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.13.4/chess.js';
import { redrawArrows, ChessboardArrows } from './chessboard_arrows.js';
import { toggleDifLineBtn, addClickListeners, clearCanvas, getBoardFen, swapArrows, recolorNotation, oppTurn } from './helpers.js';
import { highlightLastMove, clearRightClickHighlights, highlightRightClickedSquares, highlightBorder } from './highlight.js';
import { onDragStart, onDragMove, onDrop, onSnapEnd } from './move.js';
import { updateEvalBar, gameStart } from './update.js';
import { swapCapturedPieces } from './captured_pieces.js';

export var page = document.getElementById('page').getAttribute('data-page');
export var boardWidth = 700;
export var startPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR_w_KQkq_-_0_1';
export var startElement = document.getElementById('-1');
export var squareClass = 'square-55d63';
export var pieceClass = 'piece-417db';
export var lastFen = startPosition;
export var possibleMoves = [];
export var otherChoices = [];
export var finished = false;
export var keepPlaying = false;
export var movementAllowed = true;
export var highlightedSquares = [];
export var rightClickMemory = {};
export var arrowMemory = {};
export var mouseDownSquare;
export var leftClickSquare;
export var config = {
    draggable: true,
    dropOffBoard: 'snapback',
    position: 'start',
    orientation: 'white',
    onDragMove: onDragMove,
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
};
export var board = Chessboard('myBoard', config);
export var game = new Chess();
export var overlay = new ChessboardArrows('board_wrapper');

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
    if (page == 'practice' && !game.game_over()) $('#keepPlayingBtn')[0].style.display = 'block';
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
    var fen = getBoardFen();
    if (!(fen in rightClickMemory)) rightClickMemory[fen] = [];
    if (!square) rightClickMemory[fen] = [];
    else {
        if (add && !rightClickMemory[fen].includes(square)) rightClickMemory[fen].push(square);
        else if (rightClickMemory[fen].includes(square)) {
            var index = rightClickMemory[fen].indexOf(square);
            rightClickMemory[fen].splice(index, 1);
        };
    };
};

function repeatArrow(arrow) {
    var drawnArrows = arrowMemory[getBoardFen()];
    for (let i = 0; i < drawnArrows.length; i++) {
        if (drawnArrows[i].initial['x'] == arrow.initial['x'] &&
            drawnArrows[i].final['x'] == arrow.final['x'] &&
            drawnArrows[i].initial['y'] == arrow.initial['y'] &&
            drawnArrows[i].final['y'] == arrow.final['y']) return i + 1;
    };
    return 0;
};

export function modArrows(arrow='', add=true) {
    var fen = getBoardFen();
    if (!(fen in arrowMemory)) arrowMemory[fen] = [];
    if (!arrow) arrowMemory[fen] = [];
    else {
        var index = repeatArrow(arrow);
        var repeated = !!index;
        if (add && !repeated) arrowMemory[fen].push(arrow);
        else if (repeated) arrowMemory[fen].splice(index - 1, 1);
    };
    drawArrows();
};

export function drawArrows() {
    clearCanvas();
    var fen = getBoardFen();
    if (!(fen in arrowMemory)) arrowMemory[fen] = [];
    var arrows = arrowMemory[fen];
    for (let i = 0; i < arrows.length; i++) {
        redrawArrows(arrows[i].context, arrows[i].initial, arrows[i].final);
    };
};

export function setMouseDownSquare(square) {
    mouseDownSquare = square;
};

export function setLeftClickSquare(square) {
    leftClickSquare = square;
};

export function swapBoard() {
    config.orientation = (config.orientation == 'white' ? 'black' : 'white');
    config.position = getBoardFen().replace(/_/g, ' ');
    board = Chessboard('myBoard', config);
    addClickListeners();
    recolorNotation();
    highlightLastMove();
    highlightRightClickedSquares();
    swapCapturedPieces();
    swapArrows();
    updateEvalBar();
};

export function resetBoard() {
    finished = false;
    keepPlaying = false;
    config.position = 'start';
    board = Chessboard('myBoard', config);
    game = new Chess();
    setLastFen();
};

document.addEventListener('mousedown', e => {
    var ignore = document.getElementsByClassName('ignore');
    if ((Array.from(ignore)).includes(e.target)) return;
    if (e.button == 0) {
        if (e.target.classList.contains(pieceClass) && !oppTurn()) highlightBorder(leftClickSquare);
        clearRightClickHighlights(true);
        modArrows();
    };
});

document.addEventListener('contextmenu', e => {
    e.preventDefault();
});

gameStart();