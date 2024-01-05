import { finished, possibleMoves, config, board, game, updateFen } from './globals.js';
import { updateStatus } from './update.js';
import { playIllegal } from './sounds.js';

export var page = document.getElementById('page').getAttribute('data-page');
export var lastFen = '';
export var moveNum = 1;
export var otherChoices = [];

export function resetMoveVars() {
    lastFen = '';
    otherChoices = [];
    moveNum = 1;
};

export function decMoveNum() {
    moveNum--;
};

export function makeComputerMove() {
    if (!finished) {
        console.log('Making a computer move');
        if (game.game_over()) {
            return;
        };
        console.log('Computer moves: ' + possibleMoves);
        var randomIdx = Math.floor(Math.random() * possibleMoves.length);
        var move = possibleMoves[randomIdx];
        otherChoices = possibleMoves;
        otherChoices.splice(randomIdx, 1);
        console.log('Other choices were: ' + otherChoices);
        lastFen = game.fen();
        var color = game.turn();
        var data = game.move(move);
        board.position(game.fen());
        var element = document.getElementById('n' + moveNum);
        element.hidden = false;
        element = document.getElementById(color + moveNum);
        element.innerHTML = move;
        if (game.turn() == 'w') {
            moveNum++;
        };
        updateStatus(move, data.from, data.to);
        console.log('Your moves: ' + possibleMoves);
    };
};

function onDragStartPractice (source, piece, position, orientation) {
    if (game.game_over()) {
        return false;
    };
    // only pick up pieces for own side
    if ((config.orientation === 'white' && piece.search(/^b/) !== -1 && game.turn() === 'w') || 
        (config.orientation === 'black' && piece.search(/^w/) !== -1 && game.turn() === 'b')) {
        return false;
    };
};

function onDragStartView (source, piece, position, orientation) {
    if (game.game_over()) {
        return false;
    };
    // only pick up pieces for the side to move
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    };
    lastFen = updateFen(game.fen()).replace(/ /g, '_');
}

function onDropPractice (source, target) {
    var before = game.fen();
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });
    var after = game.fen();
    if (move === null || (!finished && !(possibleMoves.includes(move.san)))) {
        if (source != target) {
            console.log('Move not in prepared opening.  Allowed moves are: ');
            console.log(possibleMoves);
            var hintElement = document.getElementById('hints');
            hintElement.innerHTML = 'Allowed moves are: ' + possibleMoves;
            playIllegal();
        };
        if (before != after) {
            game.undo();
        };
        return 'snapback';
    }
    else {
        console.log('A legal move was played: ' + move.san);
        var color = game.turn() == 'w' ? 'b' : 'w';
        var element = document.getElementById('n' + moveNum);
        element.hidden = false;
        element = document.getElementById(color + moveNum);
        element.innerHTML = move.san;
        if (game.turn() == 'w') {
            moveNum++;
        };
        updateStatus(move.san, source, target);
        window.setTimeout(makeComputerMove, 500);
    };
};

function onDropView (source, target) {
    var before = game.fen();
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });
    var after = game.fen();
    if (move === null || !(possibleMoves.includes(move.san))) {
        if (source != target) {
            console.log('Move not in prepared opening.  Allowed moves are: ');
            console.log(possibleMoves);
            playIllegal();
        };
        if (before != after) {
            game.undo();
        };
        return 'snapback';
    }
    else {
        console.log('A legal move was played: ' + move.san);
        var old = document.getElementsByClassName('selected');
        if (old.length > 0) {
            for (let i = 0; i < old.length; i++) {
                old[i].classList.remove('selected');
            };
        };
        var element = document.querySelectorAll("[data-parent='" + lastFen + "']");
        if (element.length == 0) {
            element = [document.getElementById('0')];
        };
        for (let i = 0; i < element.length; i++) {
            if (move.san == element[i].getAttribute('data-san')) {
                element[i].classList.add('selected');
                break;
            };
        };
        updateStatus(move.san, source, target);
    };
};

export function onDragStart(source, piece, position, orientation) {
    return (page == 'practice') ? onDragStartPractice(source, piece, position, orientation) : onDragStartView(source, piece, position, orientation);
};

export function onDrop(source, target) {
    return (page == 'practice') ? onDropPractice(source, target) : onDropView(source, target);
};

export function onSnapEnd () {
    // Fixes board position after castling, en passant, pawn promotion
    board.position(game.fen());
};