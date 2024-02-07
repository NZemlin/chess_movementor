import { game } from './game.js';
import { page, startPosition } from './constants.js';
import { toggleDifLineBtn } from './page_helpers.js';
import { restartBtn } from './page.js';
import { updateHintText, updateStatus } from './update.js';

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