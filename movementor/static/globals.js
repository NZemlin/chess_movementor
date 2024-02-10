import { Chess } from 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.13.4/chess.js';
import { game } from './game.js';
import { page, startPosition } from './constants.js';
import { toggleDifLineBtn } from './page_helpers.js';
import { restartBtn } from './page.js';
import { updateBoard, updateHintText, updateStatus } from './update.js';
import { clearPremoveHighlights, highlightLastMove, highlightPremove } from './highlight.js';
import { playMoveSelf } from './sounds.js';

export var lastFen = startPosition;
export var possibleMoves = [];
export var otherChoices = [];
export var finished = false;
export var keepPlaying = false;
export var isPromoting = false;
export var isBlitzing = false;
export var freePlay = document.getElementById('0') == null;
export var engineLevel = (page == 'practice') ? document.getElementById('skill-input').value : 0;
export var curEval = 0;
export var preMoves = [];
export var preMoveGame = null;
export var draggedPieceSource = null;
export var draggedMoves = [];
export var preMoveCastlingRights = [];

export function setLastFen(fen=startPosition) {
    lastFen = fen;
};

export function setPossibleMoves(moves) {
    possibleMoves = moves;
    if (page != 'create') toggleDifLineBtn(otherChoices.length == 0);
    finished = false;
};

export function setOtherChoices(moves, index) {
    otherChoices = moves;
    otherChoices.splice(index, 1);
    toggleDifLineBtn(otherChoices.length == 0);
    if (otherChoices.length != 0) console.log('Other choices were: ' + otherChoices.join(', '));
};

export function setFinished(done) {
    if (done && isBlitzing) {
        window.setTimeout(function () {
            updateHintText();
            updateStatus();
            // console.log('Game state updated')
            console.log('----------------------------------------------------');
            restartBtn[0].click();
        }, 500);
        return;
    };
    finished = done;
    if (done && page == 'practice' && !game.game_over()) {
        $('#skill-label')[0].style.display = 'inline-block';
        $('#skill-input')[0].style.display = 'inline-block';
        $('#keepPlayingBtn')[0].style.display = 'inline-block';
    };
    modPreMoves('clear');
};

export function setKeepPlaying(cont) {
    keepPlaying = cont;
};

export function setIsPromoting(promoting) {
    isPromoting = promoting;
};

export function setIsBlitzing(blitzing) {
    isBlitzing = blitzing;
};

export function setEngineLevel() {
    engineLevel = document.getElementById('skill-input').value;
};

export function setCurEval(val) {
    curEval = val;
};

function modCastling(initial, info, source) {
    if ('kr'.includes(info.type)) {
        let changes = [];
        changes.push((info.type == 'k') ? (info.color == 'b') : !(source == 'h1'));
        changes.push((info.type == 'k') ? (info.color == 'b') : !(source == 'a1'));
        changes.push((info.type == 'k') ? (info.color == 'w') : !(source == 'h8'));
        changes.push((info.type == 'k') ? (info.color == 'w') : !(source == 'a8'));
        for (let i = 0; i < initial.length; i++) {
            preMoveCastlingRights[i] = changes[i] ? initial[i] : false;
        };
    } else preMoveCastlingRights = initial;
};

export function modPreMoves(action, source='', target='', promotion='') {
    if (action == 'clear') {
        preMoves = [];
        preMoveCastlingRights = [];
        preMoveGame = null;
        clearPremoveHighlights();
        updateBoard(game.fen(), false);
    } else if (action == 'pop') {
        preMoves.shift();
        clearPremoveHighlights(source, target);
    } else if (action == 'push') {
        preMoves.push([source, target, promotion]);
        highlightPremove(source, target);
    };
    if (action == 'pop' || action == 'push') {
        updateBoard(game.fen(), false);
        preMoveGame = new Chess(game.fen());
        let castling = preMoveGame.fen().split(' ')[2];
        let initial = [
            castling.includes('K'),
            castling.includes('Q'),
            castling.includes('k'),
            castling.includes('q'),
        ];
        for (let i = 0; i < preMoves.length; i ++) {
            let info = preMoveGame.get(preMoves[i][0]);
            let castleMove = false;
            if (info.type == 'k') {
                if (info.color == 'w' && preMoves[i][0] == 'e1') castleMove = ('g1c1'.includes(preMoves[i][1]));
                else if (info.color == 'b' && preMoves[i][0] == 'e8') castleMove = ('g8c8'.includes(preMoves[i][1]));
            };
            modCastling(initial, info, preMoves[i][0]);
            initial = preMoveCastlingRights;
            preMoveGame.remove(preMoves[i][0]);
            preMoveGame.remove(preMoves[i][1]);
            preMoveGame.put({ type: ((preMoves[i][2] != '') ? preMoves[i][2] : info.type), color: info.color }, preMoves[i][1]);
            highlightPremove(preMoves[i][0], preMoves[i][1]);
            if (castleMove) {
                let rookSquares = '';
                if (preMoves[i][1] == 'g1') rookSquares = 'h1f1';
                if (preMoves[i][1] == 'c1') rookSquares = 'a1d1';
                if (preMoves[i][1] == 'g8') rookSquares = 'h8f8';
                if (preMoves[i][1] == 'c8') rookSquares = 'a8d8';
                preMoveGame.remove(rookSquares.slice(0, 2));
                preMoveGame.remove(rookSquares.slice(-2));
                preMoveGame.put({ type: 'r', color: info.color }, rookSquares.slice(-2));
            };
        };
        updateBoard(preMoveGame.fen(), false);
        playMoveSelf();
        highlightLastMove();
    };
};

export function setDraggedPieceSource(source) {
    draggedPieceSource = source;
};

export function setDraggedMoves(moves) {
    draggedMoves = moves;
};