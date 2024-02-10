import { game, isOppTurn } from "./game.js";
import { getUnderscoredFen } from "./getters.js";
import { preMoveGame, preMoveCastlingRights } from "./globals.js";
import { page } from "./constants.js";

var up, left, down, right, upLeft, upRight, downLeft, downRight;

function bishopMoves(fileNum, rankNum, max=7) {
    let bishopMoves = [];
    upLeft = Math.min(up, left);
    upRight = Math.min(up, right);
    downLeft = Math.min(down, left);
    downRight = Math.min(down, right);
    for (let i = 0; i < Math.min(upLeft, max); i++) {
        bishopMoves.push(String.fromCharCode(fileNum - (i+1)) + String.fromCharCode(rankNum + (i+1)));
    };
    for (let i = 0; i < Math.min(upRight, max); i++) {
        bishopMoves.push(String.fromCharCode(fileNum + (i+1)) + String.fromCharCode(rankNum + (i+1)));
    };
    for (let i = 0; i < Math.min(downLeft, max); i++) {
        bishopMoves.push(String.fromCharCode(fileNum - (i+1)) + String.fromCharCode(rankNum - (i+1)));
    };
    for (let i = 0; i < Math.min(downRight, max); i++) {
        bishopMoves.push(String.fromCharCode(fileNum + (i+1)) + String.fromCharCode(rankNum - (i+1)));
    };
    return bishopMoves;
};

function rookMoves(fileNum, rankNum, max=7) {
    let rookMoves = [];
    for (let i = 0; i < Math.min(up, max); i++) {
        rookMoves.push(String.fromCharCode(fileNum) + String.fromCharCode(rankNum + (i+1)));
    };
    for (let i = 0; i < Math.min(left, max); i++) {
        rookMoves.push(String.fromCharCode(fileNum - (i+1)) + String.fromCharCode(rankNum));
    };
    for (let i = 0; i < Math.min(down, max); i++) {
        rookMoves.push(String.fromCharCode(fileNum) + String.fromCharCode(rankNum - (i+1)));
    };
    for (let i = 0; i < Math.min(right, max); i++) {
        rookMoves.push(String.fromCharCode(fileNum + (i+1)) + String.fromCharCode(rankNum));
    };
    return rookMoves;
};

export function dotAndCircleMoves(source, fen) {
    if ((!isOppTurn() && fen == getUnderscoredFen().split('_')[0]) || page != 'practice') {
        return game.moves({
            square: source,
            verbose: true,
        });
    };
    let piece = (preMoveGame != null) ? preMoveGame.get(source) : game.get(source);
    let moves = [];
    let file = source[0];
    let rank = source[1];
    let fileNum = file.charCodeAt(0);
    let rankNum = rank.charCodeAt(0);
    up = '8'.charCodeAt(0) - rankNum;
    left = fileNum - 'a'.charCodeAt(0);
    down = rankNum - '1'.charCodeAt(0);
    right = 'h'.charCodeAt(0) - fileNum;
    if (piece.type == 'p') {
        if (piece.color == 'w') {
            if (file != 'a') moves.push(String.fromCharCode(fileNum - 1) + String.fromCharCode(rankNum + 1));
            moves.push(file + String.fromCharCode(rankNum + 1));
            if (file != 'h') moves.push(String.fromCharCode(fileNum + 1) + String.fromCharCode(rankNum + 1));
            if (rank == '2') moves.push(file + '4');
        } else {
            if (file != 'a') moves.push(String.fromCharCode(fileNum - 1) + String.fromCharCode(rankNum - 1));
            moves.push(file + String.fromCharCode(rankNum - 1));
            if (file != 'h') moves.push(String.fromCharCode(fileNum + 1) + String.fromCharCode(rankNum - 1));
            if (rank == '7') moves.push(file + '5');
        };
    } else if (piece.type == 'n') {
        if (up >= 2 && left >= 1) moves.push(String.fromCharCode(fileNum - 1) + String.fromCharCode(rankNum + 2));
        if (up >= 2 && right >= 1) moves.push(String.fromCharCode(fileNum + 1) + String.fromCharCode(rankNum + 2));
        if (up >= 1 && left >= 2) moves.push(String.fromCharCode(fileNum - 2) + String.fromCharCode(rankNum + 1));
        if (up >= 1 && right >= 2) moves.push(String.fromCharCode(fileNum + 2) + String.fromCharCode(rankNum + 1));
        if (down >= 2 && left >= 1) moves.push(String.fromCharCode(fileNum - 1) + String.fromCharCode(rankNum - 2));
        if (down >= 2 && right >= 1) moves.push(String.fromCharCode(fileNum + 1) + String.fromCharCode(rankNum - 2));
        if (down >= 1 && left >= 2) moves.push(String.fromCharCode(fileNum - 2) + String.fromCharCode(rankNum - 1));
        if (down >= 1 && right >= 2) moves.push(String.fromCharCode(fileNum + 2) + String.fromCharCode(rankNum  - 1));
    } else if (piece.type == 'b') {
        return bishopMoves(fileNum, rankNum);
    } else if (piece.type == 'r') {
        return rookMoves(fileNum, rankNum);
    } else if (piece.type == 'q') {
        return bishopMoves(fileNum, rankNum).concat(rookMoves(fileNum, rankNum));
    } else if (piece.type == 'k') { 
        let castling = (preMoveCastlingRights.length != 0) ? preMoveCastlingRights : game.fen().split(' ')[2];
        if (typeof(castling) == String) {
            let temp = [];
            if (castling.length == 1) temp = Array(4).fill(false);
            else [...castling].forEach(c => temp.push(c != '-'));
        };
        if (piece.color == 'w' && source == 'e1') {
            if (castling[0]) moves.push('g1c');
            if (castling[1]) moves.push('c1c');
        } else if (piece.color == 'b' && source == 'e8') {
            if (castling[2]) moves.push('g8c');
            if (castling[3]) moves.push('c8c');
        };
        return moves.concat(bishopMoves(fileNum, rankNum, 1), rookMoves(fileNum, rankNum, 1));
    };
    return moves;
};