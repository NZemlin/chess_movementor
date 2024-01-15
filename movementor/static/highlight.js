import { startPosition, game, highlightedSquares, rightClickedSquares, setHighlightedSquares, modRightClickedSquares } from "./globals.js";

var squareClass = 'square-55d63';
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

export function highlightRightClickedSquares() {
    for (let i = 0; i < rightClickedSquares.length; i++) {
        toggleRightClickHighlight($board.find('.square-' + rightClickedSquares[i])[0], true);
    };
};

export function clearRightClickHighlights() {
    $board.find('.' + squareClass).removeClass('highlight-right-click-light');
    $board.find('.' + squareClass).removeClass('highlight-right-click-dark');
    modRightClickedSquares();
};

export function toggleRightClickHighlight(square, swap=false) {
    var dataSquare = square.getAttribute('data-square');
    var color = 'highlight-right-click-' +  lightOrDark(dataSquare);
    var highlighted = square.classList.contains(color);
    if (highlighted) square.classList.remove(color);
    else square.classList.add(color);
    if (!swap) modRightClickedSquares(dataSquare, !highlighted);
};