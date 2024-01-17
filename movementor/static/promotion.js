import { squareClass, board, game, setMovementAllowed } from './globals.js';
import { createChessPiece } from './helpers.js';
import { validateMove } from './move.js';

var promotionOptionSquares;

function setPromotionOptionSquares(color, target) {
    var file = target[0];
    var rank = parseInt(target[1]);
    var rank1 = color === 'w' ? rank - 1 : rank + 1;
    var rank2 = color === 'w' ? rank - 2 : rank + 2;
    var rank3 = color === 'w' ? rank - 3 : rank + 3;
  
    var squareBehindId1 = file + rank1;
    var squareBehindId2 = file + rank2;
    var squareBehindId3 = file + rank3;
    promotionOptionSquares = [target, squareBehindId1, squareBehindId2,  squareBehindId3];
};

export function opaqueBoardSquares(color, target) {
    setPromotionOptionSquares(color, target);
    var boardSquares = document.getElementsByClassName(squareClass);
    for (let i = 0; i < boardSquares.length; i++) {
        if (!(promotionOptionSquares.includes(boardSquares[i].getAttribute('data-square')))) {
            boardSquares[i].style.opacity = 0.5;
        } else {
            var style = getComputedStyle(boardSquares[i]);
            var backgroundColor = style.backgroundColor;
            var rgbaColor = backgroundColor.replace('rgb', 'rgba').replace(')', ',0.5)');
            boardSquares[i].style.backgroundColor = rgbaColor;
        };
    };
};
  
function clearPromotionOptions() {
    var boardSquares = document.getElementsByClassName(squareClass);
    for (let i = 0; i < boardSquares.length; i++) {
        if (!(promotionOptionSquares.includes(boardSquares[i].getAttribute('data-square')))) {
            boardSquares[i].style.opacity = 1;
        } else {
            var style = getComputedStyle(boardSquares[i]);
            var backgroundColor = style.backgroundColor;
            var rgbaColor = backgroundColor.replace('0.5)', '1)');
            boardSquares[i].style.backgroundColor = rgbaColor;
            boardSquares[i].style.opacity = 1;
        };
    };
    var elementsToRemove = document.querySelectorAll('.promotionOption');
    elementsToRemove.forEach(function (element) {
        element.parentElement.removeChild(element);
    });
};

function performPromotion(pieceType, source, target, before) {
    var move = game.move({
        from: source,
        to: target,
        promotion: pieceType.toLowerCase(),
    });
    board.position(game.fen(), false);
    validateMove(move, source, target, before, true);
};

export function attemptPromotion(color, source, target, before) {
    var targetSquare = document.getElementsByClassName('square-' + promotionOptionSquares[0])[0];
    var squareBehind1 = document.getElementsByClassName('square-' + promotionOptionSquares[1])[0];
    var squareBehind2 = document.getElementsByClassName('square-' + promotionOptionSquares[2])[0];
    var squareBehind3 = document.getElementsByClassName('square-' + promotionOptionSquares[3])[0];
  
    var piece1 = createChessPiece(color, 'Q', 'promotionOption Q', 84);
    var piece2 = createChessPiece(color, 'N', 'promotionOption N', 84);
    var piece3 = createChessPiece(color, 'R', 'promotionOption R', 84);
    var piece4 = createChessPiece(color, 'B', 'promotionOption B', 84);

    targetSquare.appendChild(piece1);
    squareBehind1.appendChild(piece2);
    squareBehind2.appendChild(piece3);
    squareBehind3.appendChild(piece4);
  
    var promotionOptions = document.getElementsByClassName('promotionOption');
    for (let i = 0; i < promotionOptions.length; i++) {
        let pieceType = promotionOptions[i].classList[1];
        promotionOptions[i].addEventListener('click', function () {
            setMovementAllowed(true);
            clearPromotionOptions();
            performPromotion(pieceType, source, target, before);
        });
    };
};