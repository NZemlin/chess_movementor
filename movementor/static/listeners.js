import { config, game } from "./game.js";
import { draggedPieceSource, finished, isPromoting, modPreMoves, preMoves } from "./globals.js";
import { practice, squareClass, pieceClass } from './constants.js';
import { getUnderscoredFen, getBoardFen } from './getters.js';
import { modArrows } from "./arrow.js";
import { dotAndCircleContext, drawMoveOptions } from './dot_circle.js';
import { initialPoint, finalPoint, clearCanvas, setInitialPoint, setFinalPoint } from './canvas_helper.js';
import { clearRightClickHighlights, toggleRightClickHighlight, highlightBorder, lightOrDark } from "./highlight.js";
import { whichCheckKey, whichClickUpdate } from './page.js';
import { clearPromotionOptions } from "./promotion.js";
import { resizeCols } from "./visual_helpers.js";
import { moveArrowBtn } from "./buttons.js";
import { drawPossibleMoveArrows } from "./arrow.js";

export var rightClickDownSquare;
export var leftClickDownSquare;

export function setRightClickDownSquare(square) {
    rightClickDownSquare = square;
};

export function setLeftClickDownSquare(square) {
    leftClickDownSquare = square;
};

function onMouseDown(e) {
    let element = (e.target.classList.contains(squareClass)) ? e.target : e.target.parentElement;
    if (e.button == 0) setLeftClickDownSquare(element.getAttribute('data-square'));
    if (e.button == 2) {
        if (preMoves.length == 0 && !isPromoting) {
            setInitialPoint(element.getAttribute('data-square'));
            setFinalPoint(element.getAttribute('data-square'));
            setRightClickDownSquare(element);
        } else {
            if (preMoves.length > 0) modPreMoves('clear');
            if (isPromoting && !(e.target.classList.contains('promotionOption'))) clearPromotionOptions();
        };
    };
};

function onMouseMove(e) {
    let element = (e.target.classList.contains(squareClass)) ? e.target : e.target.parentElement;
    if (element.classList.contains(squareClass)) setFinalPoint(element.getAttribute('data-square'));
    else setFinalPoint(null);
};

function onMouseUp(e) {
    if (e.button == 2) {
        let element = (e.target.classList.contains(squareClass)) ? e.target : e.target.parentElement;
        if (rightClickDownSquare == element) toggleRightClickHighlight(element);
        if ((initialPoint[0] != null && initialPoint[1] != null) &&
            (initialPoint[0] != finalPoint[0] || initialPoint[1] != finalPoint[1])) {
            modArrows({
                initial: { x: initialPoint[0], y: initialPoint[1] },
                final: { x: finalPoint[0], y: finalPoint[1] },
            }, true);
            if (moveArrowBtn[0].innerHTML == 'Hide Moves') drawPossibleMoveArrows();
        };
    };
};

export function addListeners() {
    // Clear legal/premove indicators and remove border highlights when right-clicking
    // while holding a piece
    document.addEventListener('mousedown', e=> {
        if (e.button == 2 && draggedPieceSource != null) {
            clearCanvas(dotAndCircleContext);
            var $board = $('#myBoard');
            $board.find('.' + squareClass).removeClass('border-highlight-light');
            $board.find('.' + squareClass).removeClass('border-highlight-dark');
            $board.find('.square-' + draggedPieceSource).removeClass('highlight-' + lightOrDark(draggedPieceSource));
        };
    });

    // Resize moves column
    window.addEventListener('resize', e=> {
        resizeCols();
    });

    // Prevent scrolling with keyboard
    window.addEventListener("keydown", e => {
        if(["Space","ArrowUp","ArrowDown",
            "ArrowLeft","ArrowRight"]
            .indexOf(e.code) > -1) e.preventDefault();
    }, false);

    var modal = document.getElementById("myModal");
    
    // Display modal if clicked
    document.getElementById("modalBtn").addEventListener('click', e=> {
        modal.style.display = "block";
    });

    // Close modal if clicked
    window.addEventListener("click", e => {
        if (e.target == modal) modal.style.display = "none";
    });
    document.getElementById("close").addEventListener('click', e=> {
        modal.style.display = "none";
    });

    // Add traversal functions to move elements
    document.onkeydown = whichCheckKey();
    var containerName = (practice) ? 'move-list-container' : 'moves-container-study';
    var container = document.getElementsByClassName(containerName)[0];
    var moveName = (practice) ? 'played-move' : 'move';
    container.addEventListener('click', e=> {
        if (e.target.classList.contains(moveName)) whichClickUpdate(e.target);
    });
    
    var board_wrapper = document.getElementById('board_wrapper');

    // Prevent contextmenu on right-click
    board_wrapper.addEventListener('contextmenu', e => {
        e.preventDefault();
    });

    if ('ontouchstart' in document.documentElement) {
        board_wrapper.addEventListener('touchstart', function() {
            document.documentElement.style.overflow = 'hidden';
        });
        document.addEventListener('touchend', function() {
            document.documentElement.style.overflow = 'auto';
        });
    };

    // Record mouse coords on right-click mousedown
    board_wrapper.addEventListener("mousedown", onMouseDown);
    
    // Draw arrow and add to memory on right-click mouseup
    board_wrapper.addEventListener("mousemove", onMouseMove);
    
    // Record mouse coords on mousemove
    board_wrapper.addEventListener("mouseup", onMouseUp);

    // Erase right-click highlights/arrows and draw
    // legal moves dots/circles on left-click mousedown
    document.addEventListener('mousedown', e => {
        var ignore = document.getElementsByClassName('ignore');
        if ((Array.from(ignore)).includes(e.target)) return;
        if (e.button == 0) {
            clearRightClickHighlights(true);
            modArrows();
            if (moveArrowBtn[0].innerHTML == 'Hide Moves' && !finished) drawPossibleMoveArrows();
            if (isPromoting) {
                if (!(e.target.classList.contains('promotionOption'))) clearPromotionOptions();
                return;
            };
            if (!e.target.classList.contains(pieceClass) || getUnderscoredFen() != getBoardFen()) return;
            let pieceColor = e.target.getAttribute('data-piece')[0];
            if ((practice && !finished && pieceColor == config.orientation[0]) ||
                (!practice && pieceColor == game.turn())) {
                highlightBorder(leftClickDownSquare);
                drawMoveOptions();
            };
        };
    });

    // Clear legal move dots and circles on mouseup
    document.addEventListener('mouseup', e => {
        if (e.button == 0) {
            clearCanvas(dotAndCircleContext);
        };
    });
};