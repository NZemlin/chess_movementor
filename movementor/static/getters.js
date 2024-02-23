import { game, fixFenEp } from "./game.js";
import { practice } from "./constants.js";

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

export function getLastMoveElement() {
    return document.querySelectorAll("[data-own='" + getUnderscoredFen() + "']")[0];
};

export function getNextMoveColor() {
    return (game.turn() === 'w' ? 'white' : 'black');
};