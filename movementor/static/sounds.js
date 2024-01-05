let gameStart = new Audio('./static/audio/game-start.mp3');
let moveSelf = new Audio('./static/audio/move-self.mp3');
let moveOpponent = new Audio('./static/audio/move-opponent.mp3');
let capture = new Audio('./static/audio/capture.mp3');
let castle = new Audio('./static/audio/castle.mp3');
let promote = new Audio('./static/audio/promote.mp3');
let moveCheck = new Audio('./static/audio/move-check.mp3');
let gameEnd = new Audio('./static/audio/game-end.mp3');
let illegal = new Audio('./static/audio/illegal.mp3');

export function playGameStart() {
    gameStart.play()
}

export function playMoveSelf() {
    moveSelf.play()
}

export function playMoveOpponent() {
    moveOpponent.play()
}

export function playCapture() {
    capture.play()
}

export function playCastle() {
    castle.play()
}

export function playPromote() {
    promote.play()
}

export function playMoveCheck() {
    moveCheck.play()
}

export function playGameEnd() {
    gameEnd.play()
}

export function playIllegal() {
    illegal.play()
}