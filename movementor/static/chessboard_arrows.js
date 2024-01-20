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

import { modArrows } from "./globals.js";

var offsetXDot = 2.3;
var offsetyDot = 1.5;

export function drawDot(context, x, y, r) {
    context.beginPath();
    context.lineWidth = 5;
    context.arc(x + offsetXDot, y + offsetyDot, r, 0, 2 * Math.PI);
    context.fill();
};

var offsetXCircle = 2.2;
var offsetyCircle = 1.5;

export function drawCircle(context, x, y, r) {
    context.beginPath();
    context.lineWidth = 5;
    context.arc(x + offsetXCircle, y + offsetyCircle, r, 0, 2 * Math.PI);
    context.stroke();
};

// initialise vars
var initialPoint = { x: null, y: null };
var finalPoint = { x: null, y: null };
var arrowWidth = 25;
var offsetXArrow = -3;
var offsetyArrow = -14;

// source: https://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag
function drawArrow(context, fromx, fromy, tox, toy, r) {
    var x_center = tox;
    var y_center = toy;
    var angle, x, y;
    
    context.beginPath();
    
    angle = Math.atan2(toy-fromy,tox-fromx);
    x = r*Math.cos(angle) + x_center;
    y = r*Math.sin(angle) + y_center;

    context.moveTo(x, y);
    
    angle += (1/3)*(2*Math.PI);
    x = r*Math.cos(angle) + x_center;
    y = r*Math.sin(angle) + y_center;
    
    context.lineTo(x, y);
    
    angle += (1/3)*(2*Math.PI);
    x = r*Math.cos(angle) + x_center;
    y = r*Math.sin(angle) + y_center;
    
    context.lineTo(x, y);
    context.closePath();
    context.fill();
}

export function drawArrowToCanvas(context) {
    // offset finalPoint so the arrow head hits the center of the square
    var xFactor, yFactor;
    if (finalPoint.x == initialPoint.x) {
        yFactor = Math.sign(finalPoint.y - initialPoint.y)*arrowWidth;
        xFactor = 0;
    } else if (finalPoint.y == initialPoint.y) {
        xFactor = Math.sign(finalPoint.x - initialPoint.x)*arrowWidth;
        yFactor = 0;
    } else {
        // find delta x and delta y to achieve hypotenuse of arrowWidth
        var slope_mag = Math.abs((finalPoint.y - initialPoint.y)/(finalPoint.x - initialPoint.x));
        xFactor = Math.sign(finalPoint.x - initialPoint.x)*arrowWidth/Math.sqrt(1 + Math.pow(slope_mag, 2));
        yFactor = Math.sign(finalPoint.y - initialPoint.y)*Math.abs(xFactor)*slope_mag;
    };

    // draw line
    context.beginPath();
    context.lineCap = "square";
    context.lineWidth = 15;
    context.moveTo(initialPoint.x + offsetXArrow, initialPoint.y + offsetyArrow);
    context.lineTo(finalPoint.x - xFactor + offsetXArrow, finalPoint.y - yFactor + offsetyArrow);
    context.stroke();

    // draw arrow head
    drawArrow(context, initialPoint.x + offsetXArrow, initialPoint.y + offsetyArrow, finalPoint.x - xFactor + offsetXArrow, finalPoint.y - yFactor + offsetyArrow, arrowWidth);
}

export function redrawArrows(context, initial, final) {
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
    context.beginPath();
    context.lineCap = "square";
    context.lineWidth = 15;
    context.moveTo(initial.x + offsetXArrow, initial.y + offsetyArrow);
    context.lineTo(final.x - xFactor + offsetXArrow, final.y - yFactor + offsetyArrow);
    context.stroke();

    // draw arrow head
    drawArrow(context, initial.x + offsetXArrow, initial.y + offsetyArrow, final.x - xFactor + offsetXArrow, final.y - yFactor + offsetyArrow, arrowWidth);
};

export var ChessboardArrows = function (id, RES_FACTOR = 2, COLOUR = 'rgb(206,164,30)') {

    const NUM_SQUARES = 8;
    var resFactor, colour, drawCanvas, drawContext, primaryCanvas, primaryContext, mouseDown;
    
    resFactor = RES_FACTOR;
    colour = COLOUR; 
    
    // drawing canvas
    drawCanvas = document.getElementById('drawing_canvas');
    drawContext = changeResolution(drawCanvas, resFactor);
    drawContext.strokeStyle = drawContext.fillStyle = 'rgba(0,0,0,0.3)';
    
    // primary canvas
    primaryCanvas = document.getElementById('primary_canvas');
    primaryContext = changeResolution(primaryCanvas, resFactor);
    setContextStyle(primaryContext);
    
    // setup mouse event callbacks
    var board = document.getElementById(id);
    board.addEventListener("mousedown", function(event) { onMouseDown(event); });
    board.addEventListener("mouseup", function(event) { onMouseUp(event); });
    board.addEventListener("mousemove", function(event) { onMouseMove(event); });
    board.addEventListener('contextmenu', function (e) { e.preventDefault(); }, false);
    
    mouseDown = false;
    
    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Q(evt.clientX - rect.left),
            y: Q(evt.clientY - rect.top),
        };
    };
    
    function setContextStyle(context) {
        context.strokeStyle = context.fillStyle = colour;
        context.lineJoin = 'butt';
    };
    
    function onMouseDown(event) {
        if (event.which == 3) { // right click
            mouseDown = true;
            initialPoint = finalPoint = getMousePos(drawCanvas, event);
            // drawCircle(drawContext, initialPoint.x, initialPoint.y, primaryCanvas.width/(resFactor*NUM_SQUARES*2) - 1);
        } else if (event.which == 1) {
            var ignore = document.getElementsByClassName('ignore');
            if ((Array.from(ignore)).includes(event.target)) return;
        };
    };
    
    function onMouseUp(event) {
        if (event.which == 3) { // right click
            mouseDown = false;
            // if starting position == ending position, draw a circle to primary canvas
            if (initialPoint.x == finalPoint.x && initialPoint.y == finalPoint.y) {
                // drawCircle(primaryContext, initialPoint.x, initialPoint.y, primaryCanvas.width/(resFactor*NUM_SQUARES*2) - 1); // reduce radius of square by 1px
            } else {
                drawArrowToCanvas(primaryContext);
                modArrows({
                    context: primaryContext,
                    initial: initialPoint,
                    final: finalPoint,
                }, true);
            };
            drawContext.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        } else if (event.which == 1) { // left click
            // clear canvases
            var ignore = document.getElementsByClassName('ignore');
            if ((Array.from(ignore)).includes(event.target)) return;
            drawContext.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
            primaryContext.clearRect(0, 0, primaryCanvas.width, primaryCanvas.height);
        };
    };
    
    function onMouseMove(event) {
        finalPoint = getMousePos(drawCanvas, event);
    
        if (!mouseDown) return;
        if (initialPoint.x == finalPoint.x && initialPoint.y == finalPoint.y) return;
    
        // drawContext.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        // drawArrowToCanvas(drawContext);
    };
    
    
    function Q(x, d) {  // mid-tread quantiser
        d = primaryCanvas.width/(resFactor*NUM_SQUARES);
        return d*(Math.floor(x/d) + 0.5);
    };
    
    // source: https://stackoverflow.com/questions/14488849/higher-dpi-graphics-with-html5-canvas
    function changeResolution(canvas, scaleFactor) {
        // Set up CSS size.
        canvas.style.width = canvas.style.width || canvas.width + 'px';
        canvas.style.height = canvas.style.height || canvas.height + 'px';
    
        // Resize canvas and scale future draws.
        canvas.width = Math.ceil(canvas.width * scaleFactor);
        canvas.height = Math.ceil(canvas.height * scaleFactor);
        var ctx = canvas.getContext('2d');
        ctx.scale(scaleFactor, scaleFactor);
        return ctx;
    };
    
};