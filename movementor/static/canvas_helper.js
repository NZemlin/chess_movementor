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

import { config } from "./game.js";
import { squareSize } from "./constants.js";

export var initialPoint = { x: null, y: null };
export var finalPoint = { x: null, y: null };
export var resFactor = 2;

export function changeResolution(canvas, scaleFactor) {
    // source: https://stackoverflow.com/questions/14488849/higher-dpi-graphics-with-html5-canvas
    canvas.style.width = canvas.style.width || canvas.width + 'px';
    canvas.style.height = canvas.style.height || canvas.height + 'px';

    canvas.width = Math.ceil(canvas.width * scaleFactor);
    canvas.height = Math.ceil(canvas.height * scaleFactor);
    var ctx = canvas.getContext('2d');
    ctx.scale(scaleFactor, scaleFactor);
    return ctx;
};

export function clearCanvas(context) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
};

export function setInitialPoint(square) {
    initialPoint = calcCoords(square);
};

export function setFinalPoint(square) {
    finalPoint = calcCoords(square);
};

export function calcCoords(square) {
    if (square == null) return [null, null];
    var fileNum = square[0].charCodeAt(0) - 97;
    var rankNum = square[1];
    var offsetX = (fileNum + 1) * 2.5;
    if (config.orientation[0] == 'b') return [(squareSize/2) + ((squareSize) * (7 - fileNum)) + offsetX,
                                              (squareSize/2) + ((squareSize) * (rankNum - 1))];
    else return [(squareSize/2) + ((squareSize) * fileNum) + offsetX,
                 (squareSize/2) + ((squareSize) * (8 - rankNum))];
};