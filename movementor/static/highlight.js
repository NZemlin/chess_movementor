import { highlightedSquares, setHighlightedSquares } from "./globals.js";

var squareClass = 'square-55d63';
var $board = $('#myBoard');

function lightOrDark(square) {
    return ((square[0].charCodeAt(0) - 96) + Number(square[1])) % 2 ? 'light' : 'dark';
};

export function highlightLastMove(source='', target='') {
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