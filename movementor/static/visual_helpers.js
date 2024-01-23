import { page, notationClass } from "./constants.js";
import { lightOrDark } from "./highlight.js";
import { lastKeyCode } from "./page.js";

export function scrollIfNeeded(element) {
    var observer;
    var area = (page == 'study') ? ".moves-container-study" : ".move-list-container";
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
    var width = String(document.getElementsByClassName('moves-container-study')[0].scrollWidth);
    var movesLines = document.getElementsByClassName('moves-line');
    for (let i = 0; i < movesLines.length; i++) {
        movesLines[i].style.minWidth = width + 'px';
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