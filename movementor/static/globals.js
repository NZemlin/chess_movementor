import { Chess } from 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.13.4/chess.js';
import { onDragStart, onDrop, onSnapEnd } from './move.js';
import { updateStatus } from './update.js';

export var finished = false;
export var keepPlaying = false;
export var possibleMoves = [];
export var config = {
    draggable: true,
    dropOffBoard: 'snapback',
    position: 'start',
    orientation: 'white',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
};
export var board = Chessboard('myBoard', config);
export var game = new Chess();

export function resetBoard() {
    config.position = 'start';
    board = Chessboard('myBoard', config);
    game = new Chess();
};

export function setPossibleMoves(moves) {
    possibleMoves = moves;
};

export function setFinished(done) {
    finished = done;
};

export function setKeepPlaying(cont) {
    keepPlaying = cont;
};

export function setBoard() {
    board = Chessboard('myBoard', config);
};

export function updateFen(fen) {
    var splitFen = fen.split(' ');
    var epString = splitFen[3];
    if (epString != '-') {
        var square = epString[0] + (epString[1] == '6' ? '5' : '4');
        var ep = game.get(square);
        var left = null;
        var right = null;
        if (square[0] != 'a') {
            left = game.get(String.fromCharCode(square[0].charCodeAt(0) - 1) + square[1]);
        };
        if (square[0] != 'h') {
            right = game.get(String.fromCharCode(square[0].charCodeAt(0) + 1) + square[1]);
        };
        if ((left != null && left.type == 'p' && left.color != ep.color) ||
                right != null && right.type == 'p' && right.color != ep.color) {
                return fen;
        }
        else {
            splitFen[3] = '-';
            fen = splitFen.join(' ');
            return fen;
        };
    }
    else {
        return fen;
    };
};

updateStatus();