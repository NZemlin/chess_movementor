import { config, game, isOppTurn } from './game.js';
import { possibleMoves, finished, isPromoting, preMoves, modPreMoves, setLastFen, setOtherChoices, setKeepPlaying, keepPlaying, setDraggedPieceSource, draggedPieceSource, preMoveGame, draggedMoves, setDraggedMoves } from './globals.js';
import { page } from './constants.js';
import { scrollIfNeeded } from './visual_helpers.js';
import { getBoardFen, getMoveNum, getPlayedSelected, getUnderscoredFen } from './getters.js';
import { arrowContext } from './arrow.js';
import { clearCanvas } from './canvas_helper.js';
import { lightOrDark,clearRightClickHighlights, highlightBorder } from './highlight.js';
import { opaqueBoardSquares, attemptPromotion, performPromotion } from './promotion.js';
import { updateHintText, updateGameState, updateBoard } from './update.js';
import { playIllegal } from './sounds.js';
import { tryEvaluation, makeEngineMove } from './eval.js';
import { dotAndCircleContext, drawMoveOptions } from './dot_circle.js';

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
    // console.log('Computer chose: ' + move);
    setOtherChoices(possibleMoves, randomIdx);
    setLastFen(getUnderscoredFen());
    var data = game.move(move);
    if (preMoves.length > 0) updateBoard(preMoveGame.fen(), false);
    else updateBoard(game.fen(), false);
    clearRightClickHighlights();
    clearCanvas(arrowContext);
    updateHintText(false);
    setPlayedMoveInfo(data);
    updateGameState(move, data.from, data.to);
    // if (finished) console.log('Line is finished');
    // else console.log('Your moves: ' + possibleMoves.join(', '));
    if (preMoves.length != 0) attemptPreMove();
};

export function attemptPreMove() {
    let source = preMoves[0][0];
    let target = preMoves[0][1];
    let promo = preMoves[0][2];
    var before = game.fen();
    if (promo != '') performPromotion(promo, source, target, before, false);
    else {
        var move = game.move({
            from: source,
            to: target,
        });
        validateMove(move, source, target, before, true, true);
    };
};

export function onDragStart(source, piece, position, orientation) {
    // Return false if game is over or promotion is being attempted
    if (game.game_over() || isPromoting) return false;
    if (page != 'practice') {
        // Return false if picking up wrong side to move
        if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1)) return false;
    };
    // if on practice page, only pick up own side and if
    // current board position is current game position and
    // if game is still going
    if (page == 'practice') {
        // Return false if line is finished and waiting for engine level selection
        if (finished) return false;
        // Return false if current position isn't from latest move
        if (getUnderscoredFen() != getBoardFen()) return false;
        // Return false if trying to pick up opponent's pieces
        if (!piece.startsWith(config.orientation[0])) return false;
    };
    setLastFen(getUnderscoredFen());
    $('#myBoard').find('.square-' + source).addClass('highlight-' +  lightOrDark(source));
    highlightBorder(source);
    setDraggedPieceSource(source);
};

export function onDragMove (newLocation, oldLocation, source, piece, position, orientation) {
    highlightBorder(newLocation, oldLocation);
};

function handlePromotionAttempt(move, source, target, before, preMove=false) {
    if (preMove) {
        let g = (preMoveGame != null) ? preMoveGame : game;
        if (g.get(source) ? g.get(source).type != 'p' : g.get(target).type != 'p') return false;
    } else if (game.get(source).type != 'p') return validateMove(move, source, target, before, true, preMove);
    var left, right;
    if (source.charAt(0) != 'a') left = String.fromCharCode(source.charAt(0).charCodeAt(0) - 1);
    if (source.charAt(0) != 'h') right = String.fromCharCode(source.charAt(0).charCodeAt(0) + 1);
    var rank = config.orientation[0] == 'w' ? '8' : '1';
    if (((left != null && target == left + rank && game.get(left + rank) != null) ||
         (right != null && target == right + rank && game.get(right + rank) != null) ||
         (target == source.charAt(0) + rank && game.get(target) == null))) {
        opaqueBoardSquares(config.orientation[0], target);
        attemptPromotion(config.orientation[0], source, target, before, preMove);
    } else return preMove ? false : validateMove(move, source, target, before, true, preMove);
};

export function handleLegalMove(move, source, target, preMove) {
    // console.log('A legal move was played: ' + move.san);
    if (page == 'practice') {
        setPlayedMoveInfo(move);
        updateGameState(move.san, source, target, false, preMove);
        if (preMove) modPreMoves('pop', source, target);
        window.setTimeout(makeComputerMove, 500);
        return;
    };
    updateGameState(move.san, source, target);
};

export function validateMove(move, source, target, before, checkedPromo, preMove) {
    if (move === null || !(possibleMoves.includes(move.san))) {
        if (page != 'practice' && finished && move != null) {
            setKeepPlaying(true);
            handleLegalMove(move, source, target, false);
            return;
        };
        if (before != game.fen()) {
            game.undo();
            updateBoard(game.fen(), false);
        };
        if (!checkedPromo) handlePromotionAttempt(move, source, target, before, preMove);
        else {
            if (source != target) {
                // console.log((!keepPlaying ? 'Move not in prepared opening.  ' : '') +
                //             'Allowed moves are: ' + possibleMoves.join(', '));
                if (!preMove) playIllegal();
                updateHintText(true);
            };
            $('#myBoard').find('.square-' + source).removeClass('highlight-' +  lightOrDark(source));
            if (preMove) modPreMoves('clear');
            return 'snapback';
        };
    } else handleLegalMove(move, source, target, preMove);
};

export function onDrop(source, target) {
    if (source == 'offboard' || target == 'offboard') return 'snapback';
    setDraggedPieceSource(null);
    highlightBorder(target, target);
    let preMovePushed = false;
    let preMove = false;
    if (isOppTurn() && page == 'practice') {
        preMove = true;
        draggedMoves.forEach(move => {
            if (move.slice(0, 2) == target) {
                let promotionAttempt = (handlePromotionAttempt('', source, target, '', true));
                if (promotionAttempt != null) modPreMoves('push', source, target);
                preMovePushed = true;
            };
        });
        setDraggedMoves([]);
    } else {
        var before = game.fen();
        var move = game.move({
            from: source,
            to: target,
        });
        validateMove(move, source, target, before, false, false);
    };
    if (preMove && !preMovePushed) return 'snapback';
};

export function onSnapEnd() {
    // Fixes board position after castling, en passant, pawn promotion
    if (preMoves.length == 0) updateBoard(game.fen(), false);
};

export function onChange(oldPos, newPos) {
    if (draggedPieceSource != null) {
        clearCanvas(dotAndCircleContext);
        drawMoveOptions(Chessboard.objToFen(newPos));
    };
};