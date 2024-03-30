import { games, gameParents, gameHistories, comments } from "./edit.js";

export function toHex(s) {
    return Array.from(s)
        .map(function(c) {
            return c.charCodeAt(0) < 128
                ? c.charCodeAt(0).toString(16)
                : encodeURIComponent(c)
                    .replace(/%/g, "")
                    .toLowerCase();
        })
        .join("");
};

export function fromHex(s) {
    return s.length == 0
        ? ""
        : decodeURIComponent("%" + (s.match(/.{1,2}/g) || []).join("%"));
};

export const encodeComment = function(s) {
    s = s.replace(new RegExp(mask("\r?\n"), "g"), " ");
    return `{${toHex(s.slice(1, s.length - 1))}}`;
};

export const decodeComment = function(s) {
    if (s.startsWith("{") && s.endsWith("}")) {
        return fromHex(s.slice(1, s.length - 1));
    };
};

export function turnNumber(moves, idx) {
    let spaces = 0;
    let openParenCount = 0;
    for (let i = 0; i != idx; i++) {
        if (moves[i] == '{') {
            while (moves[i] != '}') {
                i++;
            };
            i++;
            spaces--;
        };
        if (moves[i] == '(') {
            openParenCount++;
            while (openParenCount != 0) {
                i++;
                if (moves[i] == '(') openParenCount++;
                if (moves[i] == ')') openParenCount--;
            };
            spaces--;
        };
        if (moves[i] == ' ') spaces++;
    };
    return Math.ceil(spaces/3);
};

export function firstDifIndex(s1, s2) {
    if (s1 == s2) return -1;
    let len = Math.min(s1.length, s2.length);
    let lastSpace = 0;
    let s1Offset = 0;
    let s2Offset = 0;
    let openParenCount = 0;
    for (let i = 0; i != len; i++) {
        if (s1[i + s1Offset] == ' ') lastSpace = i;
        if (s1[i + s1Offset] != s2[i + s2Offset]) {
            if (s1[i + s1Offset] == '(') {
                openParenCount++;
                while (openParenCount != 0) {
                    s1Offset++;
                    if (s1[i + s1Offset] == '(') openParenCount++;
                    if (s1[i + s1Offset] == ')') openParenCount--;
                };
                s1Offset += 2;
                i--;
                lastSpace = i;
            } else if (s2[i + s2Offset] == '(') {
                openParenCount++;
                while (openParenCount != 0) {
                    s2Offset++;
                    if (s2[i + s2Offset] == '(') openParenCount++;
                    if (s2[i + s2Offset] == ')') openParenCount--;
                };
                s2Offset += 2;
                i--;
                lastSpace = i;
            } else return [lastSpace, s1Offset, s2Offset];
        };
    };
};

export function fixWhiteComments(pgn) {
    let openBraceCount = 0;
    let lastSpaceOrParen = -1;
    let curTurn = '0';
    let nums = '0123456789';
    for (let i = 0; i != pgn.length; i++) {
        if (' ('.includes(pgn[i])) lastSpaceOrParen = i;
        else if (pgn[i] == '{') openBraceCount++;
        else if (pgn[i] == '.' &&  openBraceCount == 0) {
            if (nums.includes(pgn[i-1])) curTurn = pgn.slice(lastSpaceOrParen + 1, i);
        } else if (pgn[i] == '}' && i != pgn.length - 1) {
            openBraceCount--;
            while (pgn[i] != ' ') {
                i++;
            };
            if (!(nums+'(').includes(pgn[i + 1])) {
                pgn = pgn.slice(0, i + 1) + curTurn + '... ' + pgn.slice(i + 1);
                i += (curTurn + '... ').length;
            } else i--;
        };
    };
    return pgn;
};

export function firstDifMoveNum(a1, a2) {
    for (let i = 0; i != Math.min(a1.length, a2.length); i++) {
        if (a1[i]['san'] != a2[i]['san']) return i;
    };
    return 0;
};

export function moveElement(move, idNum, child1, gameIdx, mainline, varStart, lastMove, commentIdx) {
    let comment = 'none';
    if (commentIdx in comments) {
        if (move['after'] in comments[commentIdx]) comment = comments[commentIdx][move['after']];
    };
    let moveEle = document.createElement('span');
    moveEle.id = String(idNum);
    moveEle.setAttribute('data-own', move['after'].replace(/ /g, '_'));
    moveEle.setAttribute('data-parent', move['before'].replace(/ /g, '_'));
    moveEle.setAttribute('data-child-1', child1['after'].replace(/ /g, '_'));
    moveEle.setAttribute('data-child-2', move['after'].replace(/ /g, '_'));
    moveEle.setAttribute('data-game', gameIdx);
    moveEle.setAttribute('data-mainline', mainline);
    moveEle.setAttribute('data-variation-start', varStart);
    moveEle.setAttribute('data-last-move', lastMove);
    moveEle.setAttribute('data-san', move['san']);
    moveEle.setAttribute('data-uci', move['lan']);
    moveEle.setAttribute('data-ep', move['after'].split(' ')[3] == '-' ? 'false' : 'true');
    moveEle.setAttribute('data-color', move['color'] == 'w' ? 'white' : 'black');
    moveEle.setAttribute('data-turn', String(parseInt(move['after'].split(' ')[5]) - ((move['color'] == 'b') ? 1 : 0)));
    moveEle.setAttribute('data-source', move['from']);
    moveEle.setAttribute('data-target', move['to']);
    moveEle.setAttribute('data-comment', comment);
    moveEle.classList.add('move', 'ignore');
    let sanText = document.createTextNode(move['san']);
    moveEle.appendChild(sanText);
    return moveEle;
};

export function calculateSpaces(idx, nextGameTurnDif, moveLines) {
    let spaces = 0;
    let children = moveLines[idx].children;
    let inc = nextGameTurnDif % 2 != 0 ? 1 : 3;
    for (let i = 0; i != children.length; i++) {
        if (!children[i].innerHTML.startsWith(String(Math.floor((nextGameTurnDif + inc)/2)) + '.')) {
            let count = (children[i].innerHTML.match(/&nbsp;/g) || []).length;
            let temp = children[i].innerHTML.length;
            temp -= count * 5;
            spaces += temp;
        } else return (spaces + 3);
    };
};

export function createStartElement() {
    let hidden = document.createElement('span');
    hidden.hidden = true;
    hidden.id = -1;
    hidden.setAttribute('data-fen', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR_w_KQkq_-_0_1');
    hidden.setAttribute('data-own', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR_w_KQkq_-_0_1');
    hidden.setAttribute('data-parent', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR_w_KQkq_-_0_1');
    hidden.setAttribute('data-child-1', gameHistories[0][0]['after'].replace(/ /g, '_'));
    hidden.setAttribute('data-child-2', gameHistories[0][0]['after'].replace(/ /g, '_'));
    hidden.setAttribute('data-comment', 'none');
    hidden.classList.add('move');
    return hidden;
};

export function findAllOrderedChildren(parent) {
    let children = [];
    for (let i = 0; i != games.length; i++) {
        if (gameParents[i] == parent) children.push(i);
    };
    if (children.length == 0) return [];
    else {
        let sortedChildren = children.sort(function(a, b) {
            return (firstDifMoveNum(gameHistories[parent], gameHistories[b]) -
                    firstDifMoveNum(gameHistories[parent], gameHistories[a]));
        });
        let turnDifs = [];
        for (let i = 0; i != sortedChildren.length; i++) {
            let curMoveDif = Math.floor(firstDifMoveNum(gameHistories[parent], gameHistories[sortedChildren[i]])/2) + 1;
            if (!(turnDifs.includes(curMoveDif))) turnDifs.push(curMoveDif);
        };
        let groupedChildren = [];
        for (let i = 0; i != turnDifs.length; i++) {
            groupedChildren.push(sortedChildren.filter(el => (Math.floor(firstDifMoveNum(gameHistories[parent], gameHistories[el])/2) + 1) == turnDifs[i]));
        };
        let resortedChildren = [];
        for (let i = 0; i != groupedChildren.length; i++) {
            resortedChildren = resortedChildren.concat(groupedChildren[i].sort(function(a, b) {
                return (firstDifMoveNum(gameHistories[parent], gameHistories[a]) -
                        firstDifMoveNum(gameHistories[parent], gameHistories[b]));
            }));
        };
        let allChildren = [];
        for (let i = 0; i != resortedChildren.length; i++) {
            allChildren.push(resortedChildren[i]);
            allChildren = allChildren.concat(findAllOrderedChildren(resortedChildren[i]));
        };
        return allChildren;
    };
};

export function addBarsAndFixAttributes() {
    let moveLines = document.getElementsByClassName('moves-container-study')[0].children;
    for (let i = moveLines.length - 1; i != 0; i--) {
        let lowerSpaces = (moveLines[i].children[0].innerHTML.match(/&nbsp;|\|/g) || []).length;
        if (lowerSpaces > 2) {
            let start = i - 1;
            for (let j = start; j != 0; j--) {
                let higherSpaces = (moveLines[j].children[0].innerHTML.match(/&nbsp;|\|/g) || []).length;
                if (higherSpaces <= lowerSpaces && start != j - 1) {
                    for (let k = start; k != j; k--) {
                        let spaces = moveLines[k].children[0].innerHTML.match(/&nbsp;|\|/g);
                        spaces[lowerSpaces] = '|';
                        moveLines[k].children[0].innerHTML = spaces.join('');
                    };
                    let lowerMove = moveLines[i].children[2];
                    let upperMove = null;
                    if (higherSpaces == lowerSpaces) upperMove = moveLines[j].children[(higherSpaces == 2 ? 1 : 2)];
                    else {
                        let turnNum = parseInt(lowerMove.getAttribute('data-turn'));
                        let color = lowerMove.getAttribute('data-color');
                        let i = 0;
                        while (i != moveLines[j].children.length) {
                            let curMove = moveLines[j].children[i];
                            let curMoveTurnNum = parseInt(curMove.getAttribute('data-turn'));
                            if (curMove.classList.contains('move') &&
                                ((color == 'white' && turnNum == 1 && turnNum == curMoveTurnNum) ||
                                 (color != curMove.getAttribute('data-color') &&
                                  ((color == 'white' && curMoveTurnNum == turnNum - 1) ||
                                   (color == 'black' && curMoveTurnNum == turnNum))))) {
                                upperMove = curMove;
                                break;
                            };
                            i++;
                            if (i == moveLines[j].children.length && upperMove == null) {
                                j--;
                                i = 0;
                            };
                        };
                    };
                    lowerMove.setAttribute('data-parent', upperMove.getAttribute('data-own'));
                    upperMove.setAttribute('data-child-2', lowerMove.getAttribute('data-own'));
                    break;
                };
            };
        };
    };
};