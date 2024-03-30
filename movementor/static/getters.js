import { game, fixFenEp } from "./game.js";
import { practice, startElement } from "./constants.js";
import { findClosestSmallerElementId } from "./page_helpers.js";

export function getMoveNum() {
    return parseInt(game.fen().split(' ').slice(-1));
};

export function getSelected() {
    return document.getElementsByClassName('selected')[0];
};

export function getPlayedSelected() {
    return document.getElementsByClassName('played-selected')[0];
};

export function getUnderscoredFen() {
    return fixFenEp(game.fen()).replace(/ /g, '_');
};

export function getBoardFen() {
    return (practice) ? getPlayedSelected().getAttribute('data-fen') : getUnderscoredFen();
};

export function getLastMoveElement(beforeId=-2, dir='') {
    let elements = document.querySelectorAll("[data-own='" + getUnderscoredFen() + "']");
    if (elements[0] == startElement()) return startElement();
    if (dir == 'greater') {
        for (let i = 0; i != elements.length; i++) {
            if (parseInt(elements[i].id) > beforeId) return elements[i];
        };
    } else if (dir == 'less') {
        return findClosestSmallerElementId(beforeId, elements);
    } else return elements[0];
};

export function getNextMoveColor() {
    return (game.turn() === 'w' ? 'white' : 'black');
};