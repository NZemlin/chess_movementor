import { page, possibleMoves, finished, config, board, game, setLastFen } from './globals.js';
import { scrollIfNeeded, updateFen, toggleDifLineBtn, getMoveNum, oppTurn } from './helpers.js';
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
    if (finished || game.game_over() || !oppTurn()) {
        return;
    };
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
    // only pick up pieces for the side to move, if game is still going, and if line isn't finished
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
        game.game_over() ||
        finished) {
        return false;
    };
    // only pick up own side if on practice page
    if (page == 'practice' && oppTurn()) {
        return false;
    };
    setLastFen(updateFen(game.fen()).replace(/ /g, '_'));
};

export function onDrop(source, target) {
    var before = game.fen();
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q',
    });
    var after = game.fen();
    if (move === null || !(possibleMoves.includes(move.san))) {
        if (source != target) {
            console.log('Move not in prepared opening.  Allowed moves are: ' + possibleMoves.join(', '));
            playIllegal();
            updateHintText(true);
        };
        if (before != after) {
            game.undo();
        };
        return 'snapback';
    } else {
        console.log('A legal move was played: ' + move.san);
        updateStatus(move.san, source, target);
        if (page == 'practice') {
            var color = game.turn() == 'w' ? 'b' : 'w';
            var moveNum = (getMoveNum() - (color != config.orientation[0]));
            document.getElementById('n' + moveNum).hidden = false;
            var element = document.getElementById(color + moveNum);
            element.innerHTML = move.san;
            if (color == 'b') {
                scrollIfNeeded(element);
            };
            window.setTimeout(makeComputerMove, 500);
        };
    };
};

export function onSnapEnd () {
    // Fixes board position after castling, en passant, pawn promotion
    board.position(game.fen(), false);
};