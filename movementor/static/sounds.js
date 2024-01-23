import { isOppTurn } from "./game.js";
import { keepPlaying } from "./globals.js";

export function playGameStart() {
    let gameStart = new Audio('./static/audio/game-start.mp3');
    gameStart.play();
};

export function playMoveSelf() {
    let moveSelf = new Audio('./static/audio/move-self.mp3');
    moveSelf.play();
};

export function playMoveOpponent() {
    let moveOpponent = new Audio('./static/audio/move-opponent.mp3');
    moveOpponent.play();
};

export function playCapture() {
    let capture = new Audio('./static/audio/capture.mp3');
    capture.play();
};

export function playCastle() {
    let castle = new Audio('./static/audio/castle.mp3');
    castle.play();
};

export function playPromote() {
    let promote = new Audio('./static/audio/promote.mp3');
    promote.play();
};

export function playMoveCheck() {
    let moveCheck = new Audio('./static/audio/move-check.mp3');
    moveCheck.play();
};

export function playGameEnd() {
    let gameEnd = new Audio('./static/audio/game-end.mp3');
    gameEnd.play();
};

export function playIllegal() {
    let illegal = new Audio('./static/audio/illegal.mp3');
    illegal.play();
};

export function playSound(move='') {
    if (move.includes('#')) {
        playGameEnd();
    } else if (move.includes('+')) {
        playMoveCheck();
    } else if (move.includes('=')) {
        playPromote();
    } else if (move.includes('x')) {
        playCapture();
    } else if (move.includes('O')) {
        playCastle();
    } else if (isOppTurn()) {
        playMoveSelf();
    } else if (move) {
        playMoveOpponent();
    } else if (!keepPlaying) playGameStart();
};