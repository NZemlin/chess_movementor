import { page, possibleMoves, finished, movementAllowed, config, board, game, setLastFen, setMovementAllowed } from './globals.js';
import { scrollIfNeeded, updateFen, toggleDifLineBtn, getMoveNum, oppTurn } from './helpers.js';
import { opaqueBoardSquares, attemptPromotion } from './promotion.js';
import { updateHintText, updateStatus } from './update.js';
import { playIllegal } from './sounds.js';

export var moveNum = 1;
export var otherChoices = [];

export function resetMoveVars() {
    setLastFen();
    moveNum = 1;
    otherChoices = [];
};

export function decMoveNum() {
    moveNum--;
};

export function makeComputerMove() {
    if (finished || game.game_over() || !oppTurn()) return;
    var randomIdx = Math.floor(Math.random() * possibleMoves.length);
    var move = possibleMoves[randomIdx];
    console.log('Computer chose: ' + move);
    otherChoices = possibleMoves;
    otherChoices.splice(randomIdx, 1);
    toggleDifLineBtn(otherChoices.length == 0);
    if (otherChoices.length != 0) {
        console.log('Other choices were: ' + otherChoices.join(', '));
    };
    setLastFen(updateFen(game.fen()).replace(/ /g, '_'));
    var color = game.turn();
    var moveNum = (getMoveNum() - (color == config.orientation[0]));
    var data = game.move(move);
    board.position(game.fen(), false);
    document.getElementById('n' + moveNum).hidden = false;
    var element = document.getElementById(color + moveNum);
    element.innerHTML = move;
    if (color == 'w') {
        scrollIfNeeded(element);
    };
    updateHintText(false);
    updateStatus(move, data.from, data.to);
    if (finished) {
        console.log('Line is finished');
    } else {
        console.log('Your moves: ' + possibleMoves.join(', '));
    };
};

export function onDragStart(source, piece, position, orientation) {
    // only pick up pieces for the side to move, if game is still going,
    // if line isn't finished, and if movement is allowed
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
         game.game_over() || finished || !movementAllowed) return false;
    // only pick up own side if on practice page
    if (page == 'practice' && oppTurn()) return false;
    setLastFen(updateFen(game.fen()).replace(/ /g, '_'));
};

function handlePromotionAttempt(move, source, target, before) {
    if (game.get(source).type != 'p') return validateMove(move, source, target, before, true);
    var left, right;
    if (source.charAt(0) != 'a') {
        left = String.fromCharCode(source.charAt(0).charCodeAt(0) - 1);
    };
    if (source.charAt(0) != 'h') {
        right = String.fromCharCode(source.charAt(0).charCodeAt(0) + 1);
    };
    var num = config.orientation[0] == 'w' ? '8' : '1';
    if (((left != null && target == left + num && game.get(left + num) != null) ||
         (right != null && target == right + num && game.get(right + num) != null) ||
         (target == source.charAt(0) + num && game.get(target) == null))) {
        setMovementAllowed(false);
        opaqueBoardSquares(config.orientation[0], target);
        attemptPromotion(config.orientation[0], source, target, before);
    } else return validateMove(move, source, target, before, true);
};

export function handleLegalMove(move, source, target) {
    console.log('A legal move was played: ' + move.san);
    updateStatus(move.san, source, target);
    if (page == 'practice') {
        var color = game.turn() == 'w' ? 'b' : 'w';
        var moveNum = (getMoveNum() - (color != config.orientation[0]));
        document.getElementById('n' + moveNum).hidden = false;
        var element = document.getElementById(color + moveNum);
        element.innerHTML = move.san;
        if (color == 'b') scrollIfNeeded(element);
        window.setTimeout(makeComputerMove, 500);
    };
};

export function validateMove(move, source, target, before, checkedPromo) {
    if (move === null || !(possibleMoves.includes(move.san))) {
        if (before != game.fen()) {
            game.undo();
            board.position(game.fen(), false);
        };
        if (!checkedPromo) handlePromotionAttempt(move, source, target, before);
        else {
            if (source != target) {
                console.log('Move not in prepared opening.  Allowed moves are: ' + possibleMoves.join(', '));
                playIllegal();
                updateHintText(true);
            };
            return 'snapback';
        };
    } else handleLegalMove(move, source, target);
};

export function onDrop(source, target) {
    var before = game.fen();
    var move = game.move({
        from: source,
        to: target,
    });
    validateMove(move, source, target, before, false);
};

export function onSnapEnd() {
    // Fixes board position after castling, en passant, pawn promotion
    board.position(game.fen(), false);
};