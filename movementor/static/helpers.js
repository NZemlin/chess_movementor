import { page, squareClass, startElement, mouseDownSquare, config, game, setMouseDownSquare, arrowMemory, drawArrows, boardWidth } from "./globals.js";
import { lightOrDark, toggleRightClickHighlight } from "./highlight.js";
import { updateHintText } from "./update.js";
import * as sounds from './sounds.js';

export function scrollIfNeeded(element) {
    var observer;
    var area = (page == 'view') ? ".moves-container-view" : ".move-list-container";
    var options = {
        root: document.querySelector(area),
        rootMargin: "-100px",
        threshold: 0,
    };
    const callback = (entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                entry.target.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'nearest',
                });
            };
        });
    };
    observer = new IntersectionObserver(callback, options);
    observer.observe(element);
};

export function updateFen(fen) {
    var splitFen = fen.split(' ');
    var epString = splitFen[3];
    if (epString != '-') {
        var square = epString[0] + (epString[1] == '6' ? '5' : '4');
        var ep = game.get(square);
        var file = square[0];
        var fileNum = file.charCodeAt(0);
        var rank = square[1];
        var left = null;
        var right = null;
        if (file != 'a') left = game.get(String.fromCharCode(fileNum - 1) + rank);
        if (file != 'h') right = game.get(String.fromCharCode(fileNum + 1) + rank);
        if ((left != null && left.type == 'p' && left.color != ep.color) ||
             right != null && right.type == 'p' && right.color != ep.color) return fen;
        else {
            splitFen[3] = '-';
            fen = splitFen.join(' ');
            return fen;
        };
    } else return fen;
};

export function timeoutBtn(btn, time=1) {
    btn.disabled = true;
    setTimeout(()=>{
      btn.disabled = false;
    }, time*1000);
};

export function resetMoveList() {
    var nums = document.getElementsByClassName('move-list-num');
    for (let i = 0; i < nums.length; i++) {
        nums[i].hidden = true;
    };
    var playedMoves = document.getElementsByClassName('played-move');
    for (let i = 0; i != playedMoves.length; i++) {
        playedMoves[i].innerHTML = ''
        playedMoves[i].style.visibility = 'hidden';
        playedMoves[i].setAttribute('data-fen', '');
        playedMoves[i].setAttribute('data-source', '');
        playedMoves[i].setAttribute('data-target', '');
        playedMoves[i].setAttribute('data-eval', '');
    }
    getPlayedSelected().classList.remove('played-selected');
    startElement.classList.add('played-selected');
};

export function toggleDifLineBtn(done) {
    if (page == 'view') return;
    var difLineBtn = document.getElementById('difLineBtn');
    difLineBtn.innerHTML = done ? 'No Other Lines' : 'Different Line';
    difLineBtn.disabled = done;
};

export function resetButtons() {
    $('#keepPlayingBtn')[0].style.display = 'none';
    toggleDifLineBtn();
    updateHintText();
};

export function createChessPiece(color, pieceType, pieceClasses, size) {
    let pieceName = color + pieceType.toUpperCase();
    let img = document.createElement("img");
    img.src = 'static/img/chesspieces/wikipedia/' + pieceName + '.png';
    if (pieceClasses) img.className = pieceClasses;
    var dataPiece = document.createAttribute('data-piece')
    dataPiece.value = pieceName
    img.setAttributeNode(dataPiece)
    img.style = 'width:' + size + 'px;height:' + size + 'px;';
    return img;
};

export function recolorNotation() {
    var notations = document.getElementsByClassName('notation-322f9');
    for (let i = 0; i < notations.length; i++) {
        var parent = notations[i].parentElement;
        var dataSquare = parent.getAttribute('data-square')
        var newColor = lightOrDark(dataSquare) == 'light' ? 'rgb(119,153,84)' : 'rgb(233,237,204)';
        notations[i].style.color = newColor;
    };
};

export function addRightClickListeners() {
    addRightClickDownListeners();
    addRightClickUpListeners();
};

export function addRightClickDownListeners() {
    var squares = document.getElementsByClassName(squareClass);
    for (let i = 0; i < squares.length; i++) {
        squares[i].addEventListener("mousedown", e => {
            if (e.button == 2) setMouseDownSquare(squares[i]);
        });
    };
};

export function addRightClickUpListeners() {
    var squares = document.getElementsByClassName(squareClass);
    for (let i = 0; i < squares.length; i++) {
        squares[i].addEventListener("mouseup", e => {
            if (e.button == 2 && mouseDownSquare == squares[i]) toggleRightClickHighlight(squares[i]);
        });
    };
};

export function clearCanvas() {
    var c = document.getElementById('primary_canvas');
    var context = c.getContext('2d');
    context.clearRect(0,0, context.canvas.width, context.canvas.height);
};

export function swapArrows() {
    for (var key in arrowMemory) {
        var arrows = arrowMemory[key];
        var newArrows = [];
        for (let i = 0; i != arrows.length; i++) {
            let initialPoint = { x: null, y: null };
            let finalPoint = { x: null, y: null };
            initialPoint.x = boardWidth - arrows[i].initial.x;
            initialPoint.y = boardWidth - arrows[i].initial.y;
            finalPoint.x = boardWidth - arrows[i].final.x;
            finalPoint.y = boardWidth - arrows[i].final.y;
            let newArrow = {
                context: arrows[i].context,
                initial: initialPoint,
                final: finalPoint,
            };
            newArrows.push(newArrow);
        };
        arrowMemory[key] = newArrows;
    };
    drawArrows();
};

export function playSound(move='') {
    if (move.includes('#')) {
        sounds.playGameEnd();
    } else if (move.includes('+')) {
        sounds.playMoveCheck();
    } else if (move.includes('=')) {
        sounds.playPromote();
    } else if (move.includes('x')) {
        sounds.playCapture();
    } else if (move.includes('O')) {
        sounds.playCastle();
    } else if (oppTurn()) {
        sounds.playMoveSelf();
    } else if (move) {
        sounds.playMoveOpponent();
    } else sounds.playGameStart();
};

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
    return updateFen(game.fen()).replace(/ /g, '_');
};

export function getBoardFen() {
    return (page == 'practice') ? getPlayedSelected().getAttribute('data-fen') : getUnderscoredFen();
};

export function lastMoveElement() {
    return document.querySelectorAll("[data-own='" + getUnderscoredFen() + "']")[0];
};

export function nextMoveColor() {
    return (game.turn() === 'w' ? 'white' : 'black');
};

export function oppTurn() {
    return (game.turn() == 'w' && config.orientation == 'black' || 
            game.turn() == 'b' && config.orientation == 'white');
};