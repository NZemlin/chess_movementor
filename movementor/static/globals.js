import { game } from './game.js';
import { page, startPosition } from './constants.js';
import { toggleDifLineBtn } from './page_helpers.js';

export var lastFen = startPosition;
export var possibleMoves = [];
export var otherChoices = [];
export var finished = false;
export var keepPlaying = false;
export var movementAllowed = true;
export var curEval;

export function setLastFen(fen=startPosition) {
    lastFen = fen;
};

export function setPossibleMoves(moves) {
    possibleMoves = moves;
    toggleDifLineBtn(otherChoices.length == 0);
    finished = false;
};

export function setOtherChoices(moves, index) {
    otherChoices = moves;
    otherChoices.splice(index, 1);
    toggleDifLineBtn(otherChoices.length == 0);
    if (otherChoices.length != 0) console.log('Other choices were: ' + otherChoices.join(', '));
};

export function setFinished(done) {
    finished = done;
    if (done) {
        document.getElementById('status').innerHTML = 'This line is finished';
        if (page == 'practice' && !game.game_over()) $('#keepPlayingBtn')[0].style.display = 'block';
    };
};

export function setKeepPlaying(cont) {
    keepPlaying = cont;
};

export function setMovementAllowed(allowed) {
    movementAllowed = allowed;
};

export function setCurEval(val) {
    curEval = val;
};