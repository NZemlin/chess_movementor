import { config, board, game } from "./game.js";
import { setCurEval, setLastFen } from './globals.js'
import { getBoardFen, getUnderscoredFen } from "./getters.js";
import { uciToSan, createNewEngine, oppEngine } from "./eval_helpers.js";
import { clearRightClickHighlights } from "./highlight.js";
import { clearCanvas } from "./canvas_helper.js";
import { arrowContext } from "./arrow.js";
import { updateHintText, updateGameState } from "./update.js";
import { setPlayedMoveInfo } from "./move.js";
import { updateCapturedPieces } from "./captured_pieces.js";

var evalEngine = null;
var searchingOld = false;
var evaluations, lines;

var timer = new Worker('/static/timer.js');
timer.onmessage = function (event) {
    if (event.data === 'evaluate') {
        searchingOld = false;
        getEvaluation();
    };
};

export function displayEvaluation(dataEval) {
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
    var evalBar = document.getElementById('evalBar');
    var invis = evalBar.style.visibility == 'hidden';
    var sign = (evalFloat >= 0 ) ? '+' : '-';
    if (evalFloat > 0 && config.orientation == 'black' ||
        evalFloat < 0 && config.orientation == 'white') {
        evalPopup.style.backgroundColor = '#403d39';
        evalPopup.style.color = 'white';
        evalPopup.style.border = 'none';
        evalNumOpp.style.visibility = invis ? 'hidden' : 'visible';
        evalNumOwn.style.visibility = 'hidden';
    } else {
        evalPopup.style.backgroundColor = 'white';
        evalPopup.style.color = 'black';
        evalPopup.style.border = '1px solid lightgray';
        evalNumOwn.style.visibility = invis ? 'hidden' : 'visible';
        evalNumOpp.style.visibility = 'hidden';
    };
    evalFloat = Math.abs(evalFloat);

    evalNumOwn.style.color = (config.orientation == 'white') ? '#403d39' : 'white';
    evalNumOwn.innerHTML = mate ? 'M' + parseInt(evalFloat) : evalFloat.toFixed(1);

    evalNumOpp.style.color = (config.orientation == 'white') ? 'white' : '#403d39';
    evalNumOpp.innerHTML = mate ? 'M' + parseInt(evalFloat) : evalFloat.toFixed(1);

    evalPopup.innerHTML = sign + (mate ? 'M' + parseInt(evalFloat) : evalFloat.toFixed(2));
};

export function displayLines(lines, evaluations) {
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

export function evalMessage(event) {
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

export function playMessage(event) {
    let message = event.data;
    // console.log(message);
    if (message.startsWith('bestmove')) {
        let dataMove = message.split(' ')[1];
        let source = dataMove[0] + dataMove[1];
        let target = dataMove[2] + dataMove[3];
        let promo = dataMove.length == 5 ? dataMove[4] : '';
        setLastFen(getUnderscoredFen());
        let move = game.move({
            from: source,
            to: target,
            promotion: promo,
        });
        board.position(game.fen(), false);
        clearRightClickHighlights();
        clearCanvas(arrowContext);
        updateHintText(false);
        updateGameState(move.san, source, target);
        console.log('Engine chose: ' + move.san);
        setPlayedMoveInfo(move);
        updateCapturedPieces();
    };
};

export function tryEvaluation(fen='') {
    if (evalEngine != null) {
        evalEngine.postMessage('stop');
        searchingOld = true;
    } else evalEngine = createNewEngine();
    timer.postMessage('evaluate');
};

function getEvaluation(fen='') {
    evaluations = [];
    lines = [];
    if (!fen) fen = getBoardFen().replace(/_/g, ' ');
    evalEngine.postMessage("ucinewgame");
    evalEngine.postMessage("position fen " + fen);
    evalEngine.postMessage("go perft 1");
    evalEngine.postMessage("go infinite");
};

export function makeEngineMove(fen='') {
    if (!fen) fen = getBoardFen().replace(/_/g, ' ');
    oppEngine.postMessage("position fen " + fen);
    oppEngine.postMessage("go perft 1");
    oppEngine.postMessage("go depth 10");
};