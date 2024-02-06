import { config, board, game, isOppTurn } from './game.js';
import { possibleMoves, finished, isPromoting, setLastFen, setOtherChoices, setKeepPlaying, keepPlaying } from './globals.js';
import { page } from './constants.js';
import { scrollIfNeeded } from './visual_helpers.js';
import { getMoveNum, getPlayedSelected, getUnderscoredFen } from './getters.js';
import { arrowContext } from './arrow.js';
import { clearCanvas } from './canvas_helper.js';
import { lightOrDark,clearRightClickHighlights, highlightBorder } from './highlight.js';
import { opaqueBoardSquares, attemptPromotion } from './promotion.js';
import { updateHintText, updateGameState } from './update.js';
import { playIllegal } from './sounds.js';
import { tryEvaluation, makeEngineMove } from './eval.js';

export function setPlayedMoveInfo(move) {
    var color = game.turn() == 'w' ? 'b' : 'w';
    var moveNum = (getMoveNum() - (color == 'b'));
    var element = document.getElementById(color + moveNum);
    if (!(moveNum % 2)) element.parentElement.parentElement.classList.add('dark-row');
    document.getElementById('n' + moveNum).hidden = false;
    getPlayedSelected().classList.remove('played-selected');
    element.innerHTML = move.san;
    element.style.visibility = 'visible';
    element.setAttribute('data-own', getUnderscoredFen());
    element.setAttribute('data-fen', getUnderscoredFen());
    element.setAttribute('data-source', move.from);
    element.setAttribute('data-target', move.to);
    element.classList.add('played-selected');
    if (color == 'w') scrollIfNeeded(element);
    tryEvaluation();
};

export function makeComputerMove() {
    if (finished || game.game_over() || !isOppTurn()) return;
    if (keepPlaying) {
        makeEngineMove();
        return;
    };
    var randomIdx = Math.floor(Math.random() * possibleMoves.length);
    var move = possibleMoves[randomIdx];
    console.log('Computer chose: ' + move);
    setOtherChoices(possibleMoves, randomIdx);
    setLastFen(getUnderscoredFen());
    var data = game.move(move);
    board.position(game.fen(), false);
    clearRightClickHighlights();
    clearCanvas(arrowContext);
    updateHintText(false);
    setPlayedMoveInfo(data);
    updateGameState(move, data.from, data.to);
    if (finished) console.log('Line is finished');
    else console.log('Your moves: ' + possibleMoves.join(', '));
};

export function onDragStart(source, piece, position, orientation) {
    // only pick up pieces for the side to move,
    // if game is still going, and if promotion is
    // not being attempted
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
         game.game_over() || isPromoting) return false;
    // if on practice page, only pick up own side and if
    // current board position is current game position and
    // if game is still going
    if (page == 'practice' && (finished || isOppTurn() || getUnderscoredFen() != getPlayedSelected().getAttribute('data-fen'))) return false;
    setLastFen(getUnderscoredFen());
    $('#myBoard').find('.square-' + source).addClass('highlight-' +  lightOrDark(source));
    highlightBorder(source);
};

export function onDragMove (newLocation, oldLocation, source, piece, position, orientation) {
    highlightBorder(newLocation, oldLocation);
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
        opaqueBoardSquares(config.orientation[0], target);
        attemptPromotion(config.orientation[0], source, target, before);
    } else return validateMove(move, source, target, before, true);
};

export function handleLegalMove(move, source, target) {
    console.log('A legal move was played: ' + move.san);
    if (page == 'practice') {
        setPlayedMoveInfo(move);
        updateGameState(move.san, source, target);
        window.setTimeout(makeComputerMove, 500);
        return;
    };
    updateGameState(move.san, source, target);
};

export function validateMove(move, source, target, before, checkedPromo) {
    if (move === null || !(possibleMoves.includes(move.san))) {
        if (page == 'study' && finished && move != null) {
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
            $('#myBoard').find('.square-' + source).removeClass('highlight-' +  lightOrDark(source));
            return 'snapback';
        };
    } else handleLegalMove(move, source, target);
};

export function onDrop(source, target) {
    highlightBorder(target, target)
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