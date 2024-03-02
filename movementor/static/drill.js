import { config, game } from "./game.js";
import { updateBoard, updateStatus } from "./update.js";
import { prepareNextMove } from "./move.js";
import { computerPauseTime, startPosition } from "./constants.js";
import { nearestRealParent } from "./page.js";
import { removeCapturedPieces, updateCapturedPieces } from "./captured_pieces.js";
import { limitLineBtn } from "./buttons.js";
import { playGameStart } from "./sounds.js";
import { setPossibleMoves } from "./globals.js";
import { clearMoveHighlights } from "./highlight.js";
import { clearCanvas } from "./canvas_helper.js";
import { arrowContext } from "./arrow.js";
import { getSelected } from "./getters.js";

export var limitingDrillLine = false;
export var limitedDrillLineID = 0;
var maxIDRange = document.getElementsByClassName('move').length - 1;
var moveIDs = [];

function setMoveRange() {
    if (limitedDrillLineID == 0) {
        moveIDs = Array.from(Array(maxIDRange).keys());
        return;
    };
    let temp = [];
    let start = document.getElementById(String(limitedDrillLineID));
    let turn = parseInt(start.getAttribute('data-turn'));
    let color = start.getAttribute('data-color');
    let endID = limitedDrillLineID + 1;
    let curElement = document.getElementById(String(endID));
    let curTurn, curColor;
    while (endID < maxIDRange) {
        curElement = document.getElementById(String(endID));
        curTurn = parseInt(curElement.getAttribute('data-turn'));
        curColor = curElement.getAttribute('data-color');
        if (curTurn < turn) break;
        else if (curTurn == turn && curColor == color) break;
        endID++;
    };
    let curParent = nearestRealParent(document.getElementById(String(endID)));
    let curID = parseInt(curParent.id);
    while (curID != '0') {
        temp.push(curParent.id);
        curParent = nearestRealParent(curParent);
        curID = curParent.id;
    };
    temp.push('0');
    moveIDs = temp.reverse();
    for (let i = limitedDrillLineID; i != endID; i++) {
        moveIDs.push(String(i));
    };
};

export function loadRandomDrill(move='') {
    limitLineBtn[0].disabled = true;
    if (move == 'reset') limitedDrillLineID = 0;
    clearCanvas(arrowContext);
    document.getElementById('evalBar').style.visibility = 'hidden';
    setMoveRange();
    let idInt, curMove;
    while (true) {
        idInt = Math.floor(Math.random() * (moveIDs.length - 1));
        curMove = document.getElementById(moveIDs[idInt]);
        if (curMove.getAttribute('data-color') != config.orientation &&
            curMove.getAttribute('data-own') != curMove.getAttribute('data-child-1') &&
            parseInt(curMove.getAttribute('data-turn')) <= document.getElementById('depth-input').value) break;
    };
    clearMoveHighlights();
    game.load(nearestRealParent(curMove).getAttribute('data-own').replace(/_/g, ' '));
    updateBoard(game.fen(), false);
    updateCapturedPieces();
    window.setTimeout(prepareNextMove, computerPauseTime, curMove.getAttribute('data-san'));
};

export function limitDrillLine() {
    if (limitLineBtn[0].innerHTML == 'Set Line') {
        limitingDrillLine = true;
        clearMoveHighlights();
        game.load(startPosition.replace(/_/g, ' '));
        updateBoard(game.fen(), false);
        playGameStart();
        removeCapturedPieces();
        setPossibleMoves([document.getElementById('0')]);
        updateStatus();
    } else {
        limitingDrillLine = false;
        limitedDrillLineID = parseInt(getSelected().id);
        loadRandomDrill();
    };
};