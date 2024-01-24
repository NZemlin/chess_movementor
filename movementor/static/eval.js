import { Chess } from 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.13.4/chess.js';
import { config } from "./game.js";
import { curEval, setCurEval } from './globals.js'
import { getBoardFen } from "./getters.js";

var engine = null;
var searchingOld = false;
var evaluations;
var lines;

var timer = new Worker('/static/timer.js');
timer.onmessage = function (event) {
    if (event.data === 'evaluate') {
        searchingOld = false;
        getEvaluation();
    };
};
timer.onerror = function (error) {
    console.log(error);
};

function displayEvaluation(dataEval) {
    // dataEval is always initially from white's perspective
    var mate = dataEval[0] == 'M';
    var evalFloat = mate ? parseFloat(dataEval.slice(1)) : parseFloat(dataEval);
    var blackBarHeight = 50 + ((config.orientation == 'white') ? -(evalFloat/15)*100 : (evalFloat/15)*100);
    if (mate) blackBarHeight = blackBarHeight > 50 ? 100 : 0;
    blackBarHeight = (blackBarHeight>100) ? (blackBarHeight=100) : blackBarHeight;
    blackBarHeight = (blackBarHeight<0) ? (blackBarHeight=0) : blackBarHeight;
    document.querySelector(".blackBar").style.height = blackBarHeight + "%";

    var evalPopup = document.querySelector(".eval-pop-up");
    var evalNumOwn = document.querySelector(".evalNumOwn");
    var evalNumOpp = document.querySelector(".evalNumOpp");
    var sign = (evalFloat >= 0 ) ? '+' : '-';
    if (evalFloat > 0 && config.orientation == 'black' ||
        evalFloat < 0 && config.orientation == 'white') {
        evalPopup.style.backgroundColor = '#403d39';
        evalPopup.style.color = 'white';
        evalPopup.style.border = 'none';
        evalNumOpp.style.visibility = 'visible';
        evalNumOwn.style.visibility = 'hidden';
    } else {
        evalPopup.style.backgroundColor = 'white';
        evalPopup.style.color = 'black';
        evalPopup.style.border = '1px solid lightgray';
        evalNumOwn.style.visibility = 'visible';
        evalNumOpp.style.visibility = 'hidden';
    };
    evalFloat = Math.abs(evalFloat);

    evalNumOwn.style.color = (config.orientation == 'white') ? '#403d39' : 'white';
    evalNumOwn.innerHTML = mate ? 'M' + parseInt(evalFloat) : evalFloat.toFixed(1);

    evalNumOpp.style.color = (config.orientation == 'white') ? 'white' : '#403d39';
    evalNumOpp.innerHTML = mate ? 'M' + parseInt(evalFloat) : evalFloat.toFixed(1);

    evalPopup.innerHTML = sign + (mate ? 'M' + parseInt(evalFloat) : evalFloat.toFixed(2));
};

function uciToSan(line) {
    var curFen = getBoardFen().replace(/_/g, ' ');
    var colorToMove = curFen.split(' ')[1];
    var moveNumber = curFen.split(' ')[5];
    var sanMoves = colorToMove == 'w' ? moveNumber + '. ' : moveNumber + '... ';
    var newGame = new Chess(getBoardFen().replace(/_/g, ' '));
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

function displayLines(lines, evaluations) {
    // evaluations is always initially from white's perspective
    if (getBoardFen().replace(/_/g, ' ').split(' ')[1] != config.orientation[0]) {
        lines = lines.reverse();
        evaluations = evaluations.reverse();
    };
    var len = lines.length;
    for (let i = 0; i < 3; i++) {
        let curEval = document.getElementsByClassName("eval"+(i+1))[0];
        let line = document.getElementsByClassName("line"+(i+1))[0];
        if (i >= len) {
            curEval.innerHTML = '';
            line.innerHTML = '';
        } else {
            var evalNum = String(evaluations[i]);
            var mate = evalNum[0] == 'M';
            if (mate) evalNum = evalNum.slice(1);
            var sign = (evalNum[0] == '-') ? '-' : '+';
            if (sign == '-') evalNum = evalNum.slice(1);
            var evalFloat = parseFloat(evalNum);
            curEval.innerHTML = sign + (mate ? 'M' + parseInt(evalFloat) : evalFloat.toFixed(2));
            line.innerHTML = uciToSan(lines[i]);
        };
    };
};

function message(event) {
    let whiteTurn = getBoardFen().split('_')[1] == 'w';
    let message = event.data;
    // console.log(message);
    if(message.startsWith("info depth")) {
        let depth = message.split(' ')[2];
        let multipvIndex = message.indexOf("multipv");
        if(multipvIndex!==-1) {
            let multipvString = message.slice(multipvIndex).split(" ")[1];
            let multipv = parseInt(multipvString);
            let scoreIndex = message.indexOf("score cp");
            if(scoreIndex!==-1) {
                let scoreString = message.slice(scoreIndex).split(" ")[2];
                let evaluation = parseInt(scoreString)/100;
                evaluation *= whiteTurn ? 1 : -1;
                evaluations[multipv-1] = evaluation;
            } else {
                scoreIndex = message.indexOf("score mate");
                let scoreString = message.slice(scoreIndex).split(" ")[2];
                let evaluation = parseInt(scoreString);
                evaluation *= whiteTurn ? 1 : -1;
                evaluations[multipv-1] = "M" + evaluation;
            };
            let pvIndex = message.indexOf(" pv ");
            if(pvIndex !== -1) {
                let pvString = message.slice(pvIndex+4).split(" ");
                lines[multipv-1] = pvString.join(" ");
                if (!searchingOld) {
                    setCurEval(evaluations[0]);
                    displayEvaluation(evaluations[0]);
                    displayLines(lines, evaluations);
                };
            };
        };
    } else if (message.startsWith('bestmove')) searchingOld = false;
};

function createNewEngine() {
    var newEngine = new Worker("/static/stockfish-nnue-16-single.js#/static/stockfish-nnue-16-single.wasm");
    newEngine.onmessage = function (event) { message(event) };
    newEngine.postMessage("uci");
    newEngine.postMessage("setoption name multipv value 3");
    newEngine.postMessage("isready");
    newEngine.postMessage("ucinewgame");
    return newEngine;
};

export function tryEvaluation(fen='') {
    if (engine != null) {
        engine.postMessage('stop');
        searchingOld = true;
    } else engine = createNewEngine();
    timer.postMessage('evaluate');
};

function getEvaluation(fen='') {
    evaluations = [];
    lines = [];
    if (!fen) fen = getBoardFen().replace(/_/g, ' ');
    engine.postMessage("ucinewgame");
    engine.postMessage("position fen "+fen);
    engine.postMessage("go perft 1");
    engine.postMessage("go infinite");
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