import { config } from "./game.js";
import { curEval, setCurEval } from './globals.js'
import { getBoardFen } from "./getters.js";

var engine = null;
var searchingOld = false;

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
    var mate = dataEval[0] == 'M';
    var evalFloat = mate ? parseFloat(dataEval.slice(1)) : parseFloat(dataEval);
    var blackBarHeight = 50 + ((config.orientation == 'white') ? -(evalFloat/15)*100 : (evalFloat/15)*100);
    blackBarHeight = (blackBarHeight>100 || mate) ? (blackBarHeight=100) : blackBarHeight;
    blackBarHeight = (blackBarHeight<0 || mate) ? (blackBarHeight=0) : blackBarHeight;
    document.querySelector(".blackBar").style.height = blackBarHeight + "%";

    var evalPopup = document.querySelector(".eval-pop-up");
    var evalNumOwn = document.querySelector(".evalNumOwn");
    var evalNumOpp = document.querySelector(".evalNumOpp");
    var sign;
    if (evalFloat > 0 && config.orientation == 'black' ||
        evalFloat < 0 && config.orientation == 'white') {
        evalPopup.style.backgroundColor = '#403d39';
        evalPopup.style.color = 'white';
        evalPopup.style.border = 'none';
        evalNumOpp.style.visibility = 'visible';
        evalNumOwn.style.visibility = 'hidden';
        sign = '-';
    } else {
        evalPopup.style.backgroundColor = 'white';
        evalPopup.style.color = 'black';
        evalPopup.style.border = '1px solid lightgray';
        evalNumOwn.style.visibility = 'visible';
        evalNumOpp.style.visibility = 'hidden';
        sign = '+';
    };
    evalFloat = Math.abs(evalFloat);

    evalNumOwn.style.color = (config.orientation == 'white') ? '#403d39' : 'white';
    evalNumOwn.innerHTML = mate ? 'M' + parseInt(evalFloat) : evalFloat.toFixed(1);

    evalNumOpp.style.color = (config.orientation == 'white') ? 'white' : '#403d39';
    evalNumOpp.innerHTML = mate ? 'M' + parseInt(evalFloat) : evalFloat.toFixed(1);

    evalPopup.innerHTML = sign + (mate ? 'M' + parseInt(evalFloat) : evalFloat.toFixed(2));
};

function message(event) {
    let whiteTurn = getBoardFen().split('_')[1] == 'w';
    let evaluations =[];
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
                if (evaluations.length == 1 && !searchingOld) {
                    setCurEval(evaluations[0]);
                    displayEvaluation(evaluations[0]);
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
    if (!fen) fen = getBoardFen().replace(/_/g, ' ');
    engine.postMessage("ucinewgame");
    engine.postMessage("position fen "+fen);
    engine.postMessage("go infinite");
};

export function swapEvalBar() {
    var blackBar = document.querySelector(".blackBar");
    var evalBar = document.querySelector("#evalBar");
    blackBar.style.backgroundColor = (config.orientation == 'white') ? '#403d39' : 'white';
    evalBar.style.backgroundColor = (config.orientation == 'white') ? 'white' : '#403d39';
    displayEvaluation(curEval);
};