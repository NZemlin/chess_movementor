import { Chess } from 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.13.4/chess.js';
import { lastFen, setFinished, setKeepPlaying, setLastFen } from './globals.js';
import { onDragStart, onDragMove, onDrop, onSnapEnd, onChange } from './move.js';
import { swapArrows } from './arrow.js';
import { recolorNotation } from './visual_helpers.js';
import { getBoardFen } from './getters.js';
import { highlightLastMove,  highlightRightClickedSquares } from './highlight.js';
import { gameStart } from './update.js';
import { swapCapturedPieces } from './captured_pieces.js';
import { swapEvalBar, swapLines } from './eval_helpers.js';
import { drill } from './constants.js';

export var config = {
    draggable: true,
    dropOffBoard: 'snapback',
    position: 'start',
    orientation: 'white',
    onDragMove: onDragMove,
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    onChange: onChange,
};
export var board = Chessboard('myBoard', config);
export var game = new Chess();

export function fixFenEp(fen) {
    var splitFen = fen.split(' ');
    var epString = splitFen[3];
    if (epString != '-') {
        var square = epString[0] + (epString[1] == '6' ? '5' : '4');
        var ep = game.get(square);
        var file = square[0];
        var fileNum = file.charCodeAt(0);
        var rank = square[1];
        var left = null;
        var right = null;
        if (file != 'a') left = game.get(String.fromCharCode(fileNum - 1) + rank);
        if (file != 'h') right = game.get(String.fromCharCode(fileNum + 1) + rank);
        // If there is an opposite colored pawn, next to the just pushed pawn,
        // and the ep is legal (it isn't pinned), then leave the ep in the fen
        var attemptedMove = document.querySelectorAll('[data-san="' + square + '"][data-parent="' + lastFen + '"]')[0];
        if (((left != null && left.type == 'p' && left.color != ep.color) ||
             (right != null && right.type == 'p' && right.color != ep.color))
              && attemptedMove != null && attemptedMove.getAttribute('data-ep') == 'false') return fen;
        else {
            splitFen[3] = '-';
            fen = splitFen.join(' ');
            return fen;
        };
    } else return fen;
};

export function isOppTurn() {
    return (game.turn() == 'w' && config.orientation == 'black' || 
            game.turn() == 'b' && config.orientation == 'white');
};

export function swapBoard() {
    config.orientation = (config.orientation == 'white' ? 'black' : 'white');
    config.position = getBoardFen().replace(/_/g, ' ');
    board = Chessboard('myBoard', config);
    recolorNotation();
    highlightLastMove();
    highlightRightClickedSquares();
    swapEvalBar();
    if (!drill) swapLines();
    swapCapturedPieces();
    swapArrows();
};

export function resetBoard() {
    setFinished(false);
    setKeepPlaying(false);
    config.position = 'start';
    board = Chessboard('myBoard', config);
    game = new Chess();
    setLastFen();
};

export function newBoard() {
    config.position = getBoardFen().replace(/_/g, ' ');
    board = Chessboard('myBoard', config);
};

gameStart();