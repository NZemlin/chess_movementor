import { squareClass, startPosition, game, highlightedSquares, rightClickMemory, setHighlightedSquares, modRightClickedSquares } from "./globals.js";
import { getUnderscoredFen, getBoardFen } from "./helpers.js";

var $board = $('#myBoard');

function lightOrDark(square) {
    return ((square[0].charCodeAt(0) - 96) + Number(square[1])) % 2 ? 'light' : 'dark';
};

export function highlightLastMove(source='', target='') {
    if (game.fen() == startPosition.replace(/_/g, ' ')) return;
    $board.find('.' + squareClass).removeClass('highlight-light');
    $board.find('.' + squareClass).removeClass('highlight-dark');
    if (!(source && target)) {
        $board.find('.square-' + highlightedSquares[0]).addClass('highlight-' +  lightOrDark(highlightedSquares[0]));
        $board.find('.square-' + highlightedSquares[1]).addClass('highlight-' +  lightOrDark(highlightedSquares[1]));
    } else {
        $board.find('.square-' + source).addClass('highlight-' +  lightOrDark(source));
        $board.find('.square-' + target).addClass('highlight-' +  lightOrDark(target));
        setHighlightedSquares([source, target])
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