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

import { boardWidth } from "./constants.js";
import { changeResolution, resFactor, initialPoint, finalPoint, clearCanvas } from "./canvas_helper.js";
import { getBoardFen } from "./getters.js";

export var arrowMemory = {};
export var arrowCanvas = document.getElementById('arrow_canvas');
export var arrowContext = changeResolution(arrowCanvas, resFactor);
arrowContext.strokeStyle = arrowContext.fillStyle = 'rgb(206,164,30)';
arrowContext.lineJoin = 'butt';

var offsetXArrow = -3;
var offsetyArrow = -14;
var arrowWidth = 25;

function drawArrowHead(fromx, fromy, tox, toy, r) {
    // source: https://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag
    var x_center = tox;
    var y_center = toy;
    var angle, x, y;
    
    arrowContext.beginPath();
    
    angle = Math.atan2(toy-fromy,tox-fromx);
    x = r*Math.cos(angle) + x_center;
    y = r*Math.sin(angle) + y_center;

    arrowContext.moveTo(x, y);
    
    angle += (1/3)*(2*Math.PI);
    x = r*Math.cos(angle) + x_center;
    y = r*Math.sin(angle) + y_center;
    
    arrowContext.lineTo(x, y);
    
    angle += (1/3)*(2*Math.PI);
    x = r*Math.cos(angle) + x_center;
    y = r*Math.sin(angle) + y_center;
    
    arrowContext.lineTo(x, y);
    arrowContext.closePath();
    arrowContext.fill();
}

export function drawArrow(initial=initialPoint, final=finalPoint) {
    // offset finalPoint so the arrow head hits the center of the square
    var xFactor, yFactor;
    if (final.x == initial.x) {
        yFactor = Math.sign(final.y - initial.y)*arrowWidth;
        xFactor = 0;
    } else if (final.y == initial.y) {
        xFactor = Math.sign(final.x - initial.x)*arrowWidth;
        yFactor = 0;
    } else {
        // find delta x and delta y to achieve hypotenuse of arrowWidth
        var slope_mag = Math.abs((final.y - initial.y)/(final.x - initial.x));
        xFactor = Math.sign(final.x - initial.x)*arrowWidth/Math.sqrt(1 + Math.pow(slope_mag, 2));
        yFactor = Math.sign(final.y - initial.y)*Math.abs(xFactor)*slope_mag;
    };

    // draw line
    arrowContext.beginPath();
    arrowContext.lineCap = "square";
    arrowContext.lineWidth = 15;
    arrowContext.moveTo(initial.x + offsetXArrow, initial.y + offsetyArrow);
    arrowContext.lineTo(final.x - xFactor + offsetXArrow, final.y - yFactor + offsetyArrow);
    arrowContext.stroke();

    // draw arrow head
    drawArrowHead(initial.x + offsetXArrow, initial.y + offsetyArrow, final.x - xFactor + offsetXArrow, final.y - yFactor + offsetyArrow, arrowWidth);
};

export function repeatArrow(arrow) {
    var drawnArrows = arrowMemory[getBoardFen()];
    for (let i = 0; i < drawnArrows.length; i++) {
        if (drawnArrows[i].initial['x'] == arrow.initial['x'] &&
            drawnArrows[i].final['x'] == arrow.final['x'] &&
            drawnArrows[i].initial['y'] == arrow.initial['y'] &&
            drawnArrows[i].final['y'] == arrow.final['y']) return i + 1;
    };
    return 0;
};

export function drawArrows() {
    clearCanvas(arrowContext);
    var fen = getBoardFen();
    if (!(fen in arrowMemory)) arrowMemory[fen] = [];
    var arrows = arrowMemory[fen];
    for (let i = 0; i < arrows.length; i++) {
        drawArrow(arrows[i].initial, arrows[i].final);
    };
};

export function modArrows(arrow='', add=true) {
    var fen = getBoardFen();
    if (!(fen in arrowMemory)) arrowMemory[fen] = [];
    if (!arrow) arrowMemory[fen] = [];
    else {
        var index = repeatArrow(arrow);
        var repeated = !!index;
        if (add && !repeated) arrowMemory[fen].push(arrow);
        else if (repeated) arrowMemory[fen].splice(index - 1, 1);
    };
    drawArrows();
};

export function swapArrows() {
    for (var key in arrowMemory) {
        var arrows = arrowMemory[key];
        var newArrows = [];
        for (let i = 0; i != arrows.length; i++) {
            let initialPoint = { x: null, y: null };
            let finalPoint = { x: null, y: null };
            initialPoint.x = boardWidth - arrows[i].initial.x;
            initialPoint.y = boardWidth - arrows[i].initial.y;
            finalPoint.x = boardWidth - arrows[i].final.x;
            finalPoint.y = boardWidth - arrows[i].final.y;
            let newArrow = {
                initial: initialPoint,
                final: finalPoint,
            };
            newArrows.push(newArrow);
        };
        arrowMemory[key] = newArrows;
    };
    drawArrows();
};