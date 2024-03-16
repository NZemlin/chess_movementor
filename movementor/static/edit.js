
import { Chess } from './chess.js';
import { pgn } from './globals.js';
import { game } from './game.js';
import { decodeComment, turnNumber, firstDifIndex, fixWhiteComments } from './edit_helpers.js';

var games = [new Chess()];
var curGameIdx = 0;
var gameParents = {};
var variationDepth = {};
var combinedPGNs = {};

export function populateGames() {
    let moves = game.loadPgn(pgn, { onlyParse: true });
    let finishedLines = [false];
    for (let halfMove = 0; halfMove < moves.length; halfMove++) {
        const comment = decodeComment(moves[halfMove]);
        if (comment !== undefined) {
            games[curGameIdx]._comments[games[curGameIdx].fen()] = comment;
            continue;
        };
  
        const move = games[curGameIdx]._moveFromSan(moves[halfMove], false);
  
        if (moves[halfMove][0] == '(') {
            let prevGameIdx = curGameIdx;
            games.push(new Chess());
            curGameIdx = games.length - 1;
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
                curGameIdx--;
            };
            while (finishedLines[curGameIdx]) {
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
    populateGameDicts();
    combinePGNs();
};

function populateGameDicts() {
    for (let i = 0; i != games.length; i++) {
        gameParents[String(i)] = null;
        variationDepth[String(i)] = 0;
        combinedPGNs[i] = games[i].pgn();
    };
    for (let i = 1; i != games.length; i++) {
        let max = 0;
        let maxParent = 0;
        for (let j = 0; j != i; j++) {
            let result = firstDifIndex(games[i].pgn(), games[j].pgn());
            let idx = result[0] + 1;
            let iOffset = result[1];
            let turnNum = turnNumber(games[i].pgn(), idx + iOffset) +
                          (games[i].pgn()[idx + iOffset - 2] == '.' ? 0 : .5);
            if (turnNum > max) {
                max = turnNum;
                maxParent = j;
            };
        };
        gameParents[String(i)] = maxParent;
    };
    for (let i = 1; i != games.length; i++) {
        let cur = i;
        while (gameParents[String(cur)] != null) {
            cur = gameParents[String(cur)];
            variationDepth[String(i)]++;
        };
    };
};

function combinePGNs() {
    let maxDepth = Math.max(...Object.values(variationDepth));
    for (let i = maxDepth; i >= 1; i--) {
        for (let j = games.length - 1; j != -1; j--) {
            if (variationDepth[String(j)] != i) continue;
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
    combinedPGNs[0] = fixWhiteComments(combinedPGNs[0]);
    // console.log(combinedPGNs[0]);
};

export function addNewMove() {
    console.log('New move');
};