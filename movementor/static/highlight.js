import { squareClass, startPosition } from './constants.js';
import { getBoardFen } from "./getters.js";

export var highlightedSquares = [];
export var rightClickMemory = {};
var $board = $('#myBoard');

export function lightOrDark(square) {
    return ((square[0].charCodeAt(0) - 96) + Number(square[1])) % 2 ? 'light' : 'dark';
};

export function highlightLastMove(source='', target='') {
    $board.find('.' + squareClass).removeClass('highlight-light');
    $board.find('.' + squareClass).removeClass('highlight-dark');
    if (getBoardFen() == startPosition) return;
    if (!(source && target)) {
        $board.find('.square-' + highlightedSquares[0]).addClass('highlight-' + lightOrDark(highlightedSquares[0]));
        $board.find('.square-' + highlightedSquares[1]).addClass('highlight-' + lightOrDark(highlightedSquares[1]));
    } else {
        $board.find('.square-' + source).addClass('highlight-' + lightOrDark(source));
        $board.find('.square-' + target).addClass('highlight-' + lightOrDark(target));
        setHighlightedSquares([source, target])
    };
};

export function highlightBorder(next='', old='') {
    if (next && next != 'offboard') {
        var NewHighlight = 'border-highlight-' + lightOrDark(next);
        document.getElementsByClassName('square-' + next)[0].classList.add(NewHighlight);
    };
    if (old && old != 'offboard') {
        var oldHighlight = 'border-highlight-' + lightOrDark(old);
        document.getElementsByClassName('square-' + old)[0].classList.remove(oldHighlight);
    };
};

export function setHighlightedSquares(squares=[]) {
    highlightedSquares = squares;
};

export function modRightClickedSquares(square='', add=true) {
    var fen = getBoardFen();
    if (!(fen in rightClickMemory)) rightClickMemory[fen] = [];
    if (!square) rightClickMemory[fen] = [];
    else {
        if (add && !rightClickMemory[fen].includes(square)) rightClickMemory[fen].push(square);
        else if (rightClickMemory[fen].includes(square)) {
            var index = rightClickMemory[fen].indexOf(square);
            rightClickMemory[fen].splice(index, 1);
        };
    };
};

export function clearRightClickHighlights(erase=false) {
    $board.find('.' + squareClass).removeClass('highlight-right-click-light');
    $board.find('.' + squareClass).removeClass('highlight-right-click-dark');
    if (erase) modRightClickedSquares();
};

export function highlightRightClickedSquares() {
    clearRightClickHighlights();
    var fen = getBoardFen();
    if (!(fen in rightClickMemory)) rightClickMemory[fen] = [];
    var squares = rightClickMemory[fen];
    for (let i = 0; i < squares.length; i++) {
        var color = 'highlight-right-click-' +  lightOrDark(squares[i]);
        $board.find('.square-' + squares[i])[0].classList.add(color);
    };
};

export function toggleRightClickHighlight(square) {
    var dataSquare = square.getAttribute('data-square');
    var color = 'highlight-right-click-' +  lightOrDark(dataSquare);
    var highlighted = square.classList.contains(color);
    if (highlighted) square.classList.remove(color);
    else square.classList.add(color);
    modRightClickedSquares(dataSquare, !highlighted);
};

export function highlightPremove(source, target) {
    $board.find('.square-' + source).addClass('highlight-premove-' + lightOrDark(source));
    $board.find('.square-' + target).addClass('highlight-premove-' + lightOrDark(target));
};

export function clearPremoveHighlights(source='', target='') {
    if (!(source || target)) {
        $board.find('.' + squareClass).removeClass('highlight-premove-light');
        $board.find('.' + squareClass).removeClass('highlight-premove-dark');
    } else {
        $board.find('.square-' + source).removeClass('highlight-premove-' + lightOrDark(source));
        $board.find('.square-' + target).removeClass('highlight-premove-' + lightOrDark(target));
    };
};