import { page, possibleMoves, finished, movementAllowed, config, board, game, setLastFen, setMovementAllowed, setOtherChoices, setKeepPlaying } from './globals.js';
import { scrollIfNeeded, clearCanvas, getMoveNum, getSelected, getPlayedSelected, getUnderscoredFen, oppTurn } from './helpers.js';
import { clearRightClickHighlights } from './highlight.js';
import { opaqueBoardSquares, attemptPromotion } from './promotion.js';
import { updateEvalBar, updateHintText, updateGameState } from './update.js';
import { playIllegal } from './sounds.js';

function setPlayedMoveInfo(move) {
    var color = game.turn() == 'w' ? 'b' : 'w';
    var moveNum = (getMoveNum() - (color == 'b'));
    var element = document.getElementById(color + moveNum);
    document.getElementById('n' + moveNum).hidden = false;
    getPlayedSelected().classList.remove('played-selected');
    element.innerHTML = move.san;
    element.style.visibility = 'visible';
    element.setAttribute('data-fen', getUnderscoredFen());
    element.setAttribute('data-source', move.from);
    element.setAttribute('data-target', move.to);
    element.classList.add('played-selected');
    element.setAttribute('data-eval', getSelected().getAttribute('data-eval'));
    if (color == 'w') scrollIfNeeded(element);
    updateEvalBar();
};

export function makeComputerMove() {
    if (finished || game.game_over() || !oppTurn()) return;
    var randomIdx = Math.floor(Math.random() * possibleMoves.length);
    var move = possibleMoves[randomIdx];
    console.log('Computer chose: ' + move);
    setOtherChoices(possibleMoves, randomIdx);
    setLastFen(getUnderscoredFen());
    var data = game.move(move);
    board.position(game.fen(), false);
    clearRightClickHighlights();
    clearCanvas();
    updateHintText(false);
    updateGameState(move, data.from, data.to);
    setPlayedMoveInfo(data);
    if (finished) console.log('Line is finished');
    else console.log('Your moves: ' + possibleMoves.join(', '));
};

export function onDragStart(source, piece, position, orientation) {
    // only pick up pieces for the side to move,
    // if game is still going, and if movement is allowed
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
         game.game_over() || !movementAllowed) return false;
    // if on practice page, only pick up own side and if
    // current board position is current game position and
    // if game is still going
    if (page == 'practice' && (finished || oppTurn() || getUnderscoredFen() != getPlayedSelected().getAttribute('data-fen'))) return false;
    setLastFen(getUnderscoredFen());
};

function handlePromotionAttempt(move, source, target, before) {
    if (game.get(source).type != 'p') return validateMove(move, source, target, before, true);
    var left, right;
    if (source.charAt(0) != 'a') left = String.fromCharCode(source.charAt(0).charCodeAt(0) - 1);
    if (source.charAt(0) != 'h') right = String.fromCharCode(source.charAt(0).charCodeAt(0) + 1);
    var rank = config.orientation[0] == 'w' ? '8' : '1';
    if (((left != null && target == left + rank && game.get(left + rank) != null) ||
         (right != null && target == right + rank && game.get(right + rank) != null) ||
         (target == source.charAt(0) + rank && game.get(target) == null))) {
        setMovementAllowed(false);
        opaqueBoardSquares(config.orientation[0], target);
        attemptPromotion(config.orientation[0], source, target, before);
    } else return validateMove(move, source, target, before, true);
};

export function handleLegalMove(move, source, target) {
    console.log('A legal move was played: ' + move.san);
    updateGameState(move.san, source, target);
    if (page == 'practice') {
        setPlayedMoveInfo(move);
        window.setTimeout(makeComputerMove, 500);
    };
};

export function validateMove(move, source, target, before, checkedPromo) {
    if (move === null || !(possibleMoves.includes(move.san))) {
        if (page == 'view' && finished && move != null) {
            setKeepPlaying(true);
            handleLegalMove(move, source, target);
            return;
        };
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