
import { Chess } from './chess.js';
import { pgn } from './globals.js';
import { game } from './game.js';

var games = [new Chess()];
var curGameIdx = 0;

export function populateGames() {
    games[curGameIdx].loadPgn(pgn)
};

function combinePGNs() {
    return;
};