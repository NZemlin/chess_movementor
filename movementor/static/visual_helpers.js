import { config, newBoard } from "./game.js";
import { study, notationClass } from "./constants.js";
import { lightOrDark } from "./highlight.js";
import { lastKeyCode } from "./page.js";
import { evalBarBtn, lineBtn } from './buttons.js';
import { arrowCanvas } from "./arrow.js";
import { dotAndCircleCanvas } from "./dot_circle.js";

export function scrollIfNeeded(element) {
    var observer;
    var area = (study) ? ".moves-container-study" : ".move-list-container";
    var container = document.querySelector(area);
    var options = {
        root: container,
        rootMargin: "-100px",
        threshold: 0,
    };
    if ('323738'.includes(lastKeyCode) && container.scrollLeft > 0 ) element = element.previousSibling;
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

export function fixStudyRows() {
    var movesLines = document.getElementsByClassName('moves-line');
    let max = 0;
    let cur = 0;
    for (let i = 0; i < movesLines.length; i++) {
        let children = movesLines[i].children
        for (let j = 0; j < children.length; j++) {
            cur += children[j].offsetWidth;
        };
        if (cur > max) max = cur;
        cur = 0;
    };
    for (let i = 0; i < movesLines.length; i++) {
        movesLines[i].style.minWidth = max + 10 + 'px'
    };
};

export function resizeCols() {
    var container = document.getElementsByClassName('container')[1];
    var evalCol = document.getElementsByClassName('eval-col')[0];
    var boardCol = document.getElementsByClassName('board-col')[0];
    var movesCol = document.getElementsByClassName('moves-col')[0];
    var boardContainer = document.getElementsByClassName('board-container')[0];
    var boardWrapper = document.getElementById('board_wrapper')
    var myBoard = document.getElementsByClassName('board')[0];
    var evalBar = document.getElementById('evalBar')
    // Viewport >= 1600
    if (container.offsetWidth >= 1233) movesCol.style.width = (container.offsetWidth - evalCol.offsetWidth - boardCol.offsetWidth - 7) + "px";
    // Viewport >= 992
    else if (container.offsetWidth >= 747) movesCol.style.width = evalCol.offsetWidth + boardCol.offsetWidth - 25 + "px";
    else {
        var curWidth = container.offsetWidth - 47;
        while (curWidth % 8 != 0) curWidth--;
        boardCol.style.width = curWidth + 'px';
        boardCol.style.width = curWidth + 'px';
        boardContainer.style.width = curWidth + 'px';
        boardContainer.style.height = curWidth + 'px';
        boardWrapper.style.width = curWidth + 'px';
        myBoard.style.width = curWidth + 'px';
        boardWrapper.style.height = myBoard.offsetHeight + 'px';
        if (container.offsetWidth < 568) {
            config.showNotation = false;
            if (!drill) {
                if (evalBarBtn[0].innerHTML == 'Hide Eval') evalBarBtn[0].click();
                if (lineBtn[0].innerHTML == 'Hide Lines') lineBtn[0].click();
                evalBarBtn[0].style.display = 'none';
                lineBtn[0].style.display = 'none';
            };
        };
        newBoard();
        evalBar.style.height = myBoard.offsetHeight + 'px';
        arrowCanvas.style.width = myBoard.offsetWidth + 'px';
        arrowCanvas.style.height = myBoard.offsetHeight + 'px';
        dotAndCircleCanvas.style.width = myBoard.offsetWidth + 'px';
        dotAndCircleCanvas.style.height = myBoard.offsetHeight + 'px';
        movesCol.style.width = evalCol.offsetWidth + boardCol.offsetWidth - 25 + "px";
    };
};

export function createChessPiece(color, pieceType, pieceClasses, size) {
    let pieceName = color + pieceType.toUpperCase();
    let img = document.createElement("img");
    img.src = 'static/img/chesspieces/wikipedia/' + pieceName + '.png';
    if (pieceClasses) img.className = pieceClasses;
    var dataPiece = document.createAttribute('data-piece');
    dataPiece.value = pieceName;
    img.setAttributeNode(dataPiece);
    img.style = 'width:' + size + 'px;height:' + size + 'px;';
    return img;
};

export function recolorNotation() {
    var notations = document.getElementsByClassName(notationClass);
    for (let i = 0; i < notations.length; i++) {
        var parent = notations[i].parentElement;
        var dataSquare = parent.getAttribute('data-square');
        var newColor = lightOrDark(dataSquare) == 'light' ? 'rgb(119,153,84)' : 'rgb(233,237,204)';
        notations[i].style.color = newColor;
    };
};