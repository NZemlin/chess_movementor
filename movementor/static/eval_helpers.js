import { Chess } from 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.13.4/chess.js';
import { curEval, keepPlaying } from './globals.js';
import { config } from './game.js';
import { getBoardFen } from './getters.js';
import { evalMessage, playMessage, displayEvaluation } from './eval.js';

export var oppEngine;

export function uciToSan(line) {
    var curFen = getBoardFen().replace(/_/g, ' ');
    var colorToMove = curFen.split(' ')[1];
    var moveNumber = curFen.split(' ')[5];
    var sanMoves = colorToMove == 'w' ? moveNumber + '. ' : moveNumber + '... ';
    var newGame = new Chess(curFen);
    var moves = line.split(' ');
    for (let i = 0; i < moves.length; i++) {
        let source = moves[i][0] + moves[i][1];
        let target = moves[i][2] + moves[i][3];
        let promo = moves[i].length == 5 ? moves[i][4] : '';
        let move = newGame.move({
            from: source,
            to: target,
            promotion: promo,
        });
        if (move != null) {
            sanMoves += move.san;
            var colorToMove = newGame.fen().split(' ')[1];
            var moveNumber = newGame.fen().split(' ')[5];
            if (i < moves.length - 1) sanMoves += colorToMove == 'w' ? ' ' + moveNumber + '. ' : ' ';
        } else console.log(curFen, sanMoves, source, target, promo);
    };
    return sanMoves;
};

export function createNewEngine() {
    var newEngine = new Worker("/static/stockfish-nnue-16-single.js#/static/stockfish-nnue-16-single.wasm");
    if (keepPlaying) newEngine.onmessage = function (event) { playMessage(event) };
    else {
        newEngine.onmessage = function (event) { evalMessage(event) };
        newEngine.onerror = function (error) { console.log(error) };
    };
    newEngine.postMessage("uci");
    if (keepPlaying) newEngine.postMessage("setoption name Skill Level value " + String(document.getElementById('skill-input').value));
    newEngine.postMessage("setoption name multipv value 3");
    newEngine.postMessage("isready");
    newEngine.postMessage("ucinewgame");
    if (keepPlaying) {
        oppEngine = newEngine;
        return;
    } else return newEngine;
};

export function swapEvalBar() {
    var blackBar = document.querySelector(".blackBar");
    var evalBar = document.querySelector("#evalBar");
    blackBar.style.backgroundColor = (config.orientation == 'white') ? '#403d39' : 'white';
    evalBar.style.backgroundColor = (config.orientation == 'white') ? 'white' : '#403d39';
    displayEvaluation(curEval);
};

export function swapLines() {
    let curEval1 = document.getElementsByClassName("eval1")[0];
    let line1 = document.getElementsByClassName("line1")[0];
    let curEval2 = document.getElementsByClassName("eval2")[0];
    let line2 = document.getElementsByClassName("line2")[0];
    let curEval3 = document.getElementsByClassName("eval3")[0];
    let line3 = document.getElementsByClassName("line3")[0];
    let oldEval1 = curEval1.innerHTML;
    let oldLine1 = line1.innerHTML;
    if (!curEval3.innerHTML) {
        if (curEval2.innerHTML) {
            curEval1.innerHTML = curEval2.innerHTML;
            line1.innerHTML = line2.innerHTML;
            curEval2.innerHTML = oldEval1;
            line2.innerHTML = oldLine1;
        };
    } else {
        curEval1.innerHTML = curEval3.innerHTML;
        line1.innerHTML = line3.innerHTML;
        curEval3.innerHTML = oldEval1;
        line3.innerHTML = oldLine1;
    };
};