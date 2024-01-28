import { game, isOppTurn } from "./game.js";
import { finished } from "./globals.js";
import { page, squareClass, pieceClass, squareSizeY } from './constants.js';
import { getUnderscoredFen, getBoardFen } from './getters.js';
import { modArrows } from "./arrow.js";
import { drawCircle, drawDot, dotAndCircleCanvas, dotAndCircleContext } from './dot_circle.js';
import { initialPoint, finalPoint, clearCanvas, setInitialPoint, setFinalPoint } from './canvas_helper.js';
import { clearRightClickHighlights, toggleRightClickHighlight, highlightBorder } from "./highlight.js";
import { whichCheckKey, whichClickUpdate } from './page.js';
import { arrowCanvas } from "./arrow.js";
import { resFactor } from "./canvas_helper.js";

export var rightClickDownSquare;
export var leftClickDownSquare;

export function setRightClickDownSquare(square) {
    rightClickDownSquare = square;
};

export function setLeftClickDownSquare(square) {
    leftClickDownSquare = square;
};

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: Q(evt.clientX - rect.left),
        y: Q(evt.clientY - rect.top),
    };
};

function Q(x, d) {  // mid-tread quantiser
    d = arrowCanvas.width/(resFactor*8);
    return d*(Math.floor(x/d) + 0.5);
};

function onMouseDown(e) {
    let element = (e.target.classList.contains(squareClass)) ? e.target : e.target.parentElement;
    if (e.button == 0) setLeftClickDownSquare(element.getAttribute('data-square'));
    if (e.button == 2) {
        setInitialPoint(getMousePos(dotAndCircleCanvas, e));
        setFinalPoint(getMousePos(dotAndCircleCanvas, e));
        setRightClickDownSquare(element);
    };
};

function onMouseMove(e) {
    setFinalPoint(getMousePos(dotAndCircleCanvas, e));
};

function onMouseUp(e) {
    if (e.button == 2) {
        if (e.target.classList.contains(squareClass) &&
            rightClickDownSquare == e.target) toggleRightClickHighlight(e.target);
        if (initialPoint.x != finalPoint.x || initialPoint.y != finalPoint.y) {
            modArrows({
                initial: initialPoint,
                final: finalPoint,
            }, true);
        };
    };
};

export function addListeners() {
    // Prevent contextmenu on right-click
    document.addEventListener('contextmenu', e => {
        e.preventDefault();
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

    // Close modal if clicked
    document.getElementById("close").addEventListener('click', e=> {
        modal.style.display = "none";
    });

    // Add traversal functions to move elements
    document.onkeydown = whichCheckKey();
    var containerName = (page == 'practice') ? 'move-list-container' : 'moves-container-study';
    var container = document.getElementsByClassName(containerName)[0];
    var moveName = (page == 'practice') ? 'played-move' : 'move';
    container.addEventListener('click', e=> {
        if (e.target.classList.contains(moveName)) whichClickUpdate(e.target);
    });
    
    var board_wrapper = document.getElementById('board_wrapper');

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
            if (e.target.classList.contains(pieceClass) && !finished
                && getUnderscoredFen() == getBoardFen()) {
                if (isOppTurn()) highlightBorder(leftClickDownSquare);
                const moves = game.moves({
                    square: leftClickDownSquare,
                    verbose: true,
                });
                if (moves.length === 0) return;
                for (let i = 0; i < moves.length; i++) {
                    if (game.get(moves[i].to) != null) drawCircle(moves[i].to, squareSizeY/2.075 - 1);
                    else drawDot(moves[i].to, squareSizeY/6 - 1);
                };
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