import { board, game } from './game.js';
import { possibleMoves, keepPlaying, setPossibleMoves, setFinished, finished, freePlay, setKeepPlaying, draggedPieceSource, limitedLineId } from './globals.js';
import { page } from './constants.js';
import { recolorNotation, fixStudyRows } from './visual_helpers.js';
import { getLastMoveElement, getNextMoveColor } from './getters.js';
import { highlightLastMove } from './highlight.js';
import { removeCapturedPieces, updateCapturedPieces } from './captured_pieces.js';
import { playSound } from './sounds.js';
import { tryEvaluation } from './eval.js';
import { createNewEngine } from './eval_helpers.js';
import { finishedLimitedLine, nextLimitedMove } from './move.js';

export function updateBoard(fen, animation) {
    board.position(fen, animation);
    let piece = $('#myBoard').find('.square-' + draggedPieceSource).children('img')[0];
    if (draggedPieceSource != null && piece != null) piece.style.display = 'none';
};

function updateSelectedMoveElement() {
    if (keepPlaying) return;
    // console.log('Updating selected move element');
    var old = document.getElementsByClassName('selected');
    if (old.length != 0) old[0].classList.remove('selected');
    var element = getLastMoveElement();
    element.classList.add('selected');
};

function updateAllowedMoves() {
    // console.log('Updating allowed moves');
    if (limitedLineId != '' && !finishedLimitedLine) {
        setPossibleMoves([nextLimitedMove.getAttribute('data-san')]);
        return;
    } else if (keepPlaying || page == 'create') {
        setPossibleMoves(game.moves());
        return;
    };
    var curMoves = [];
    var element = getLastMoveElement();
    var fen = element.getAttribute('data-child-1');
    if (fen == element.getAttribute('data-own')) {
        setFinished(true);
        return;
    };
    element = document.querySelectorAll("[data-own='" + fen + "']")[0];
    curMoves.push(element.getAttribute('data-san'));
    if (getLastMoveElement().getAttribute('data-own') == getLastMoveElement().getAttribute('data-child-2')) {
        setPossibleMoves(curMoves);
        return;
    };
    fen = getLastMoveElement().getAttribute('data-child-2');
    while (fen != element.getAttribute('data-own')) {
        element = document.querySelectorAll("[data-own='" + fen + "']")[0];
        if (game.turn() != element.getAttribute('data-color')[0]) break;
        curMoves.push(element.getAttribute('data-san'));
        fen = element.getAttribute('data-child-2');
    };
    setPossibleMoves(curMoves);
};

export function updateHintText(own='') {
    if (page != 'practice') return;
    document.getElementById('hints').innerHTML = (possibleMoves && own) ? ('Allowed moves are: ' + possibleMoves.join(', ')) : 'No hints currently';
};

export function updateStatus() {
    // console.log('Updating status');
    var nextColor = getNextMoveColor().charAt(0).toUpperCase() + getNextMoveColor().slice(1);
    var status = nextColor + ' to move';
    if (game.in_checkmate()) status = 'Game over, ' + nextColor + ' is in checkmate.';
    else if (game.in_draw()) status = 'Game over, drawn position';
    else if (game.in_check()) status += ', ' + nextColor + ' is in check';
    if (finished) status = '(This line is finished) ' + status;
    else if (keepPlaying && !freePlay) status = '(Out of prepared opening) ' + status;
    document.getElementById('status').innerHTML = status;
};

export function updateGameState(move='', source='', target='', mute=false, preMove=false) {
    if (!mute) playSound(move);
    if (!preMove) highlightLastMove(source, target);
    updateSelectedMoveElement();
    updateCapturedPieces();
    updateAllowedMoves();
    updateHintText();
    updateStatus();
    // console.log('Game state updated')
    // if (page == 'practice') console.log('----------------------------------------------------');
    tryEvaluation();
};

function startFreePlay() {
    tryEvaluation();
    setFinished(true);
    setKeepPlaying(true);
    createNewEngine();
    setPossibleMoves(game.moves());
    document.getElementById('status').innerHTML = 'White to move';
    // console.log('Game started');
};

export function gameStart() {
    recolorNotation();
    playSound();
    removeCapturedPieces();
    if (freePlay && page == 'practice') {
        startFreePlay();
        return;
    } else if (!freePlay) setPossibleMoves([document.getElementById('0').getAttribute('data-san')]);
    else setPossibleMoves(game.moves());
    updateStatus();
    // console.log('Game started');
    // if (page == 'practice') console.log('----------------------------------------------------');
    if (page != 'practice') fixStudyRows();
    tryEvaluation();
};