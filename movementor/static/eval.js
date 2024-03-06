import { config, game } from "./game.js";
import { curEval, preMoves, setCurEval, setLastFen } from './globals.js'
import { getBoardFen, getNextMoveColor, getUnderscoredFen } from "./getters.js";
import { uciToSan, createNewEngine, oppEngine } from "./eval_helpers.js";
import { clearRightClickHighlights } from "./highlight.js";
import { clearCanvas } from "./canvas_helper.js";
import { arrowContext } from "./arrow.js";
import { updateHintText, updateGameState, updateBoard } from "./update.js";
import { setPlayedMoveInfo, attemptPreMove } from "./move.js";
import { updateCapturedPieces } from "./captured_pieces.js";
import { lineBtn } from "./buttons.js";
import { drill } from "./constants.js";

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
    // dataEval is always from white's perspective
    var mate, evalFloat, blackBarHeight;
    if (game.isGameOver()) {
        if (dataEval.length == 3) {
            evalFloat = (dataEval[0] == '1') ? 100 : -100;
            if (dataEval[0] == '1') blackBarHeight = (config.orientation == 'white') ? 0 : 100;
            else blackBarHeight = (config.orientation == 'white') ? 100 : 0;
        } else {
            evalFloat = 0;
            blackBarHeight = 50;
        };
    } else {
        mate = dataEval[0] == 'M';
        evalFloat = mate ? parseFloat(dataEval.slice(1)) : parseFloat(dataEval);
        blackBarHeight = 50 + ((config.orientation == 'white') ? -(evalFloat/15)*100 : (evalFloat/15)*100);
        if (mate) blackBarHeight = blackBarHeight > 50 ? 100 : 0;
        blackBarHeight = (blackBarHeight>100) ? (blackBarHeight=100) : blackBarHeight;
        blackBarHeight = (blackBarHeight<0) ? (blackBarHeight=0) : blackBarHeight;
    };
    document.querySelector(".blackBar").style.height = blackBarHeight + "%";

    var evalNumOwn = document.querySelector(".evalNumOwn");
    var evalNumOpp = document.querySelector(".evalNumOpp");
    var evalBar = document.getElementById('evalBar');
    var invis = evalBar.style.visibility == 'hidden';
    if (evalFloat > 0 && config.orientation == 'black' ||
        evalFloat < 0 && config.orientation == 'white') {
        evalNumOwn.style.visibility = 'hidden';
        evalNumOpp.style.visibility = invis ? 'hidden' : 'visible';
    } else {
        evalNumOwn.style.visibility = invis ? 'hidden' : 'visible';
        evalNumOpp.style.visibility = 'hidden';
    };

    var evalPopup = document.querySelector(".eval-pop-up");
    if (evalFloat > 0 || evalFloat == 0 && config.orientation == 'white') {
        evalPopup.style.backgroundColor = 'white';
        evalPopup.style.color = 'black';
        evalPopup.style.border = '1px solid lightgray';
    } else {
        evalPopup.style.backgroundColor = '#403d39';
        evalPopup.style.color = 'white';
        evalPopup.style.border = 'none';
    };
    if (game.isGameOver()) {
        evalNumOwn.style.color = (config.orientation == 'white') ? '#403d39' : 'white';
        evalNumOpp.style.color = (config.orientation == 'white') ? 'white' : '#403d39';
        let fractionText = '<sup>1</sup>&frasl;<sub>2</sub>';
        evalNumOwn.innerHTML = fractionText;
        evalNumOpp.innerHTML = fractionText;
        evalPopup.innerHTML = fractionText += '-<sup>1</sup>&frasl;<sub>2</sub>';
        return;
    };
    evalFloat = Math.abs(evalFloat);
    evalPopup.innerHTML = ((evalFloat >= 0 ) ? '+' : '-') + (mate ? 'M' + parseInt(evalFloat) : evalFloat.toFixed(2));

    evalNumOwn.style.color = (config.orientation == 'white') ? '#403d39' : 'white';
    evalNumOwn.innerHTML = mate ? 'M' + parseInt(evalFloat) : evalFloat.toFixed(1);

    evalNumOpp.style.color = (config.orientation == 'white') ? 'white' : '#403d39';
    evalNumOpp.innerHTML = mate ? 'M' + parseInt(evalFloat) : evalFloat.toFixed(1);
};

export function displayLines(lines=['', '', ''], evaluations=['', '', '']) {
    if (drill) return;
    // evaluations is always initially from white's perspective
    if (getBoardFen().replace(/_/g, ' ').split(' ')[1] != config.orientation[0]) {
        lines = lines.reverse();
        evaluations = evaluations.reverse();
    };
    var len = lines.length;
    for (let i = 0; i < 3; i++) {
        let curLineEval = document.getElementsByClassName("eval"+(i+1))[0];
        let curLine = document.getElementsByClassName("line"+(i+1))[0];
        if (i >= len) {
            curLineEval.innerHTML = '';
            curLine.innerHTML = '';
        } else {
            if (!evaluations[i]) curLineEval.innerHTML = '';
            else {
                var evalNum = String(evaluations[i]);
                var mate = evalNum[0] == 'M';
                if (mate) evalNum = evalNum.slice(1);
                var sign = (evalNum[0] == '-') ? '-' : '+';
                if (sign == '-') evalNum = evalNum.slice(1);
                var evalFloat = parseFloat(evalNum);
                curLineEval.innerHTML = sign + (mate ? 'M' + parseInt(evalFloat) : evalFloat.toFixed(2));
            };
            if (!lines[i]) curLine.innerHTML = '';
            else curLine.innerHTML = uciToSan(lines[i]);
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
        updateBoard(game.fen(), false);
        clearRightClickHighlights();
        clearCanvas(arrowContext);
        updateHintText(false);
        // console.log('Engine chose: ' + move.san);
        updateGameState(move.san, source, target);
        setPlayedMoveInfo(move);
        updateCapturedPieces();
        if (preMoves.length != 0) attemptPreMove();
    };
};

export function tryEvaluation() {
    if (game.isGameOver()) {
        if (game.isCheckmate()) {
            if (getNextMoveColor() == 'black') setCurEval('1-0');
            else setCurEval('0-1');
        } else if (game.in_draw()) setCurEval('1/2-1/2');
        displayEvaluation(curEval);
        if (evalEngine != null) evalEngine.postMessage('stop');
        searchingOld = true;
        evalEngine = null;
        displayLines();
        if (lineBtn[0].innerHTML == 'Hide Lines') lineBtn[0].click();
        return;
    };
    if (evalEngine != null) {
        evalEngine.postMessage('stop');
        searchingOld = true;
    } else {
        evalEngine = createNewEngine();
        searchingOld = false;
    };
    timer.postMessage('evaluate');
};

function getEvaluation(fen='') {
    evaluations = [];
    lines = [];
    if (!fen) fen = getBoardFen().replace(/_/g, ' ');
    if (evalEngine != null) {
        evalEngine.postMessage("ucinewgame");
        evalEngine.postMessage("position fen " + fen);
        evalEngine.postMessage("go perft 1");
        evalEngine.postMessage("go infinite");
    } else console.log('Prompted an evaluation without an engine');
};

export function makeEngineMove(fen='') {
    if (!fen) fen = getBoardFen().replace(/_/g, ' ');
    oppEngine.postMessage("position fen " + fen);
    oppEngine.postMessage("go perft 1");
    oppEngine.postMessage("go depth 10");
};