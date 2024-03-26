
import { Chess } from './chess.js';
import { pgn } from './globals.js';
import { game } from './game.js';
import { decodeComment, turnNumber, firstDifIndex, fixWhiteComments,
         moveElement, firstDifMoveNum, calculateSpaces, createStartElement,
         findAllOrderedChildren, addBarsAndFixAttributes } from './edit_helpers.js';
import { fixStudyRows } from './visual_helpers.js';

export var games, gameHistories, gameParents, comments;
var variationDepth, curGameIdx;

export function populateGames() {
    games = [new Chess()];
    gameHistories = [[]];
    gameParents = [0];
    comments = {};
    variationDepth = [0];
    curGameIdx = 0;
    let moves = game.loadPgn(pgn, { onlyParse: true });
    let finishedLines = [false];
    for (let halfMove = 0; halfMove < moves.length; halfMove++) {
        const comment = decodeComment(moves[halfMove]);
        if (comment !== undefined) {
            games[curGameIdx]._comments[games[curGameIdx].fen()] = comment;
            if (!(curGameIdx in comments)) comments[curGameIdx] = {};
            comments[curGameIdx][games[curGameIdx].fen()] = comment;
            continue;
        };
        const move = games[curGameIdx]._moveFromSan(moves[halfMove], false);
        if (moves[halfMove][0] == '(') {
            let prevGameIdx = curGameIdx;
            games.push(new Chess());
            gameHistories.push([])
            gameParents.push(curGameIdx);
            curGameIdx = games.length - 1;
            variationDepth.push(parseInt(variationDepth[String(gameParents[curGameIdx])]) + 1);
            games[curGameIdx].loadPgn(games[prevGameIdx].pgn());
            games[curGameIdx].undo();
            finishedLines.push(false);
        } else if (moves[halfMove].match(/\)+/g)) {
            let linesToFinish = moves[halfMove].length;
            while (linesToFinish > 0) {
                if (!finishedLines[curGameIdx]) {
                    finishedLines[curGameIdx] = true;
                    linesToFinish--;
                };
                gameHistories[curGameIdx] = games[curGameIdx].history({ verbose: true });
                curGameIdx--;
            };
            while (finishedLines[curGameIdx]) {
                gameHistories[curGameIdx] = games[curGameIdx].history({ verbose: true });
                curGameIdx--;
            };
        } else if (move == null) {
            if (["1-0", "0-1", "1/2-1/2", "*"].indexOf(moves[halfMove]) == -1) {
                throw new Error(`Invalid move in PGN: ${moves[halfMove]}`);
            };
        } else {
            games[curGameIdx]._makeMove(move);
            games[curGameIdx]._incPositionCount(games[curGameIdx].fen());
        };
    };
    gameHistories[0] = games[0].history({ verbose: true });
    generateHTML();
};

function generateVariations(idNum, nextGame, start) {
    let container = document.getElementsByClassName('moves-container-study')[0];
    let moveLines = [];
    let variationGames = [];
    let startGames = [nextGame];
    let i = nextGame + 1;
    while (i != gameHistories.length) {
        let curDif = firstDifMoveNum(gameHistories[0], gameHistories[i]);
        if (start == curDif && gameParents[i] == 0) startGames.push(i);
        else if (gameParents[i] == 0 && curDif > start) break;
        i++;
    };
    for (let i = 0; i != startGames.length; i++) {
        variationGames.push(startGames[i]);
        variationGames = variationGames.concat(findAllOrderedChildren(startGames[i]));
    };
    for (let i = 0; i != variationGames.length; i++) {
        let parent = gameParents[variationGames[i]];
        let parentVariationIdx = variationGames.indexOf(parent);
        let nextGameTurnDif, spaces;
        if (!startGames.includes(variationGames[i])) {
            nextGameTurnDif = firstDifMoveNum(gameHistories[variationGames[parentVariationIdx]], gameHistories[variationGames[i]]);
            spaces = calculateSpaces(parentVariationIdx, nextGameTurnDif, moveLines);
        } else {
            nextGameTurnDif = start;
            spaces = 4;
        }
        if (spaces != 0 && (Math.floor(nextGameTurnDif/2) + 1) >= 10) spaces++;
        let curMoveLine = document.createElement('span');
        let spaceSpan = document.createElement('span');
        let spaceText = document.createTextNode('\u00A0'.repeat(spaces));
        spaceSpan.appendChild(spaceText);
        curMoveLine.appendChild(spaceSpan);
        curMoveLine.classList.add('moves-line');
        if ((container.children.length + moveLines.length) % 2 == 0) curMoveLine.classList.add('dark-row');
        for (let j = nextGameTurnDif; j != gameHistories[variationGames[i]].length; j++) {
            let turnNumAndPers = '';
            if (j % 2 == 0) turnNumAndPers += String(Math.floor(j/2) + 1) + '.\u00A0';
            else if (j == nextGameTurnDif) turnNumAndPers += String(Math.floor(j/2) + 1) + '...\u00A0';
            if (turnNumAndPers != '') {
                let turnNum = document.createElement('span');
                let turnNumandPersText = document.createTextNode(turnNumAndPers);
                turnNum.appendChild(turnNumandPersText);
                curMoveLine.appendChild(turnNum);
            };
            let nextIdx = (j == gameHistories[variationGames[i]].length - 1 ? j : j + 1);
            curMoveLine.appendChild(moveElement(gameHistories[variationGames[i]][j], idNum, gameHistories[variationGames[i]][nextIdx], 'false', j == nextGameTurnDif ? 'true' : 'false', i));
            idNum++;
            if (j != gameHistories[variationGames[i]].length) {
                spaceSpan = document.createElement('span');
                spaceText = document.createTextNode('\u00A0');
                spaceSpan.appendChild(spaceText);
                curMoveLine.appendChild(spaceSpan);
            };
        };
        moveLines.push(curMoveLine);
    };
    return [idNum, Math.max(...variationGames) + 1, moveLines];
};

function generateHTML() {
    let container = document.getElementsByClassName('moves-container-study')[0];
    container.appendChild(createStartElement());
    let spaceSpan = document.createElement('span');
    spaceSpan.appendChild(document.createTextNode('\u00A0'));
    let nextGame = 1;
    let nextGameTurnDif = firstDifMoveNum(gameHistories[0], gameHistories[nextGame]);
    let blackInterrupted = false;
    let curMoveLine = document.createElement('span');
    curMoveLine.classList.add('moves-line');
    let idNum = 0;
    for (let i = 0; i != gameHistories[0].length; i++) {
        let turnNum = document.createElement('span');
        let turnNumandPersText = i < 18 && (i % 2 == 0 || blackInterrupted) ? '\u00A0' : '';
        if (i % 2 == 0 && i != 0 && curMoveLine.children.length != 0) {
            container.appendChild(curMoveLine);
            curMoveLine = document.createElement('span');
            curMoveLine.classList.add('moves-line');
            if (container.children.length % 2 == 0) curMoveLine.classList.add('dark-row');
        };
        if (i % 2 == 0) turnNumandPersText += String(Math.floor(i/2) + 1) + '.';
        else if (blackInterrupted) {
            turnNumandPersText += String(Math.floor(i/2) + 1) + '...';
            blackInterrupted = false;
        };
        let turnNumText = document.createTextNode(`${turnNumandPersText}\u00A0`);
        turnNum.appendChild(turnNumText);
        curMoveLine.appendChild(turnNum);
        let nextIdx = (i == gameHistories[0].length - 1 ? i : i + 1);
        curMoveLine.appendChild(moveElement(gameHistories[0][i], idNum, gameHistories[0][nextIdx], 'true', 'false', 0));
        idNum++;
        if (i == nextGameTurnDif) {
            container.appendChild(curMoveLine);
            if (nextGame != games.length - 1) {
                curMoveLine = document.createElement('span');
                curMoveLine.classList.add('moves-line');
                let result = generateVariations(idNum, nextGame, nextGameTurnDif);
                if (container.children.length % 2 == 0) curMoveLine.classList.add('dark-row');
                idNum = result[0];
                nextGame = result[1];
                let moveLines = result[2]
                for (let k = 0; k != moveLines.length; k++) {
                    container.appendChild(moveLines[k]);
                };
                if (nextGame != games.length) nextGameTurnDif = firstDifMoveNum(gameHistories[0], gameHistories[nextGame]);
                blackInterrupted = true;
            }
        };
    };
    container.appendChild(curMoveLine);
    addBarsAndFixAttributes();
    fixStudyRows();
};

function combinePGNs() {
    let combinedPGNs = [];
    for (let i = 0; i != games.length; i++) {
        combinedPGNs.push(games[i].pgn());
    };
    let maxDepth = Math.max(...variationDepth);
    for (let i = maxDepth; i >= 1; i--) {
        for (let j = games.length - 1; j != -1; j--) {
            if (variationDepth[j] != i) continue;
            let parentPGN = combinedPGNs[gameParents[j]];
            let childPGN = combinedPGNs[j];
            let result = firstDifIndex(parentPGN, childPGN);
            let idx = result[0] + 1;
            let parentOffset = result[1];
            let childOffset = result[2];
            let afterIdx = idx + 1;
            while (afterIdx + parentOffset < parentPGN.length) {
                if (parentPGN[afterIdx + parentOffset] == ' ') {
                    if (parentPGN[afterIdx + parentOffset + 1] == '{') {
                        do {
                            afterIdx++;
                        } while (parentPGN[afterIdx + parentOffset] != '}');
                    } else break;
                };
                afterIdx++;
            };
            let color = parentPGN[idx + parentOffset - 2] == '.' ? 'w' : 'b';
            let turnNum = turnNumber(parentPGN, idx + parentOffset);
            let turnNumAndPers = String(turnNum) + (color == 'w' ? '. ' : '... ');
            let before = parentPGN.slice(0, afterIdx + parentOffset);
            let after = parentPGN.slice(afterIdx + parentOffset + 1);
            let insert = ' (' + turnNumAndPers + childPGN.slice(idx + childOffset) + ')';
            if (after != '') {
                insert += ' ';
                if (color == 'w' && after[0] != '(') insert += String(turnNum) + '... ';
            };
            combinedPGNs[gameParents[j]] = before + insert + after;
        };
    };
    return fixWhiteComments(combinedPGNs[0]);
};

export function addNewMove() {
    console.log('New move');
};