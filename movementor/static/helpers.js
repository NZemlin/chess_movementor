import { page, config, game } from "./globals.js";

function elementInViewport(element) {
    var bounding = element.getBoundingClientRect();
    return (bounding.top >= 0 &&
        bounding.left >= 0 &&
        bounding.right <= (window.innerWidth*.75 || document.documentElement.clientWidth) &&
        bounding.bottom <= (window.innerHeight*.75 || document.documentElement.clientHeight));
};

export function scrollIfNeeded(element) {
    if (!elementInViewport(element)) {
        element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'nearest',
        });
    };
};

export function updateFen(fen) {
    var splitFen = fen.split(' ');
    var epString = splitFen[3];
    if (epString != '-') {
        var square = epString[0] + (epString[1] == '6' ? '5' : '4');
        var ep = game.get(square);
        var left = null;
        var right = null;
        if (square[0] != 'a') {
            left = game.get(String.fromCharCode(square[0].charCodeAt(0) - 1) + square[1]);
        };
        if (square[0] != 'h') {
            right = game.get(String.fromCharCode(square[0].charCodeAt(0) + 1) + square[1]);
        };
        if ((left != null && left.type == 'p' && left.color != ep.color) ||
                right != null && right.type == 'p' && right.color != ep.color) {
                return fen;
        } else {
            splitFen[3] = '-';
            fen = splitFen.join(' ');
            return fen;
        };
    } else {
        return fen;
    };
};

export function timeoutBtn(btn, time=1) {
    btn.disabled = true;
    setTimeout(()=>{
      btn.disabled = false;
    }, time*1000);
};

export function toggleDifLineBtn(done) {
    if (page == 'view') {
        return;
    };
    var difLineBtn = document.getElementById('difLineBtn');
    if (done) {
        difLineBtn.innerHTML = 'No Other Lines';
        difLineBtn.disabled = true;
    } else {
        difLineBtn.innerHTML = 'Different Line';
        difLineBtn.disabled = false;
    };
};

export function getMoveNum() {
    return parseInt(game.fen().split(' ').slice(-1));
};

export function lastMoveElement() {
    return document.querySelectorAll("[data-own='" + updateFen(game.fen()).replace(/ /g, '_') + "']")[0];
};

export function nextMoveColor() {
    return (game.turn() === 'w' ? 'white' : 'black');
};

export function oppTurn() {
    return (game.turn() == 'w' && config.orientation == 'black' || 
            game.turn() == 'b' && config.orientation == 'white');
};
