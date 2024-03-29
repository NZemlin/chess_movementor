/*

A library that extends any chessboard library to allow users to draw arrows and circles.
Right-click to draw arrows and circles, left-click to clear the drawings.

Author: Brendon McBain
Date: 07/04/2020

MIT License

Copyright (c) 2020 Brendon McBain

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

import { game, isOppTurn } from "./game.js";
import { getBoardFen, getUnderscoredFen } from "./getters.js";
import { changeResolution, resFactor, calcCoords } from "./canvas_helper.js";
import { squareSize, practice } from './constants.js';
import { dotAndCircleMoves } from "./premove.js";
import { leftClickDownSquare } from "./listeners.js";
import { draggedMoves, preMoveGame, setDraggedMoves } from "./globals.js";

export var dotAndCircleCanvas = document.getElementById('dot_and_circle_canvas');
export var dotAndCircleContext = changeResolution(dotAndCircleCanvas, resFactor);
dotAndCircleContext.strokeStyle = dotAndCircleContext.fillStyle = 'rgba(0,0,0,0.3)';

var offsetX = .75;
var offsetY = 2;
var offsetXRadius = 1.25;

export function setDotAndCircleContext() {
    dotAndCircleContext = changeResolution(dotAndCircleCanvas, resFactor);
};

export function drawDot(square, r) {
    let coords = calcCoords(square);
    let x = coords[0];
    let y = coords[1];
    dotAndCircleContext.beginPath();
    dotAndCircleContext.lineWidth = 5;
    dotAndCircleContext.arc(x + offsetX, y + offsetY, r, 0, 2 * Math.PI);
    dotAndCircleContext.fill();
};

export function drawCircle(square, r) {
    let coords = calcCoords(square);
    let x = coords[0];
    let y = coords[1];
    dotAndCircleContext.beginPath();
    dotAndCircleContext.lineWidth = 5;
    dotAndCircleContext.ellipse(x + offsetX, y + offsetY, r + offsetXRadius, r, 0, 0, 2 * Math.PI);
    dotAndCircleContext.stroke();
};

export function drawMoveOptions(fen='') {
    if (fen == '') fen = getBoardFen().split('_')[0];
    setDraggedMoves(dotAndCircleMoves(leftClickDownSquare, fen));
    if (draggedMoves.length === 0) return;
    let scalar = (draggedMoves[0].promotion != null) ? 4 : 1;
    if ((!isOppTurn() && fen == getUnderscoredFen().split('_')[0]) || !practice) {    
        for (let i = 0; scalar*i < draggedMoves.length; i++) {
            if (game.get(draggedMoves[scalar*i].to)) drawCircle(draggedMoves[scalar*i].to, squareSize/2 - 2.5);
            else drawDot(draggedMoves[scalar*i].to, squareSize/6 - 1);
        };
    } else {
        let g = (preMoveGame == null) ? game : preMoveGame;
        for (let i = 0; scalar*i < draggedMoves.length; i++) {
            if (g.get(draggedMoves[scalar*i])) drawCircle(draggedMoves[scalar*i].slice(0, 2), squareSize/2 - 2.5);
            else drawDot(draggedMoves[scalar*i].slice(0, 2), squareSize/6 - 1);
        };
    };
};