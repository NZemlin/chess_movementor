let game_start = new Audio('./static/audio/game-start.mp3');
let move_self = new Audio('./static/audio/move-self.mp3');
let move_opponent = new Audio('./static/audio/move-opponent.mp3');
let capture = new Audio('./static/audio/capture.mp3');
let castle = new Audio('./static/audio/castle.mp3');
let promote = new Audio('./static/audio/promote.mp3');
let move_check = new Audio('./static/audio/move-check.mp3');
let game_end = new Audio('./static/audio/game-end.mp3');
let illegal = new Audio('./static/audio/illegal.mp3');

export function play_game_start() {
    game_start.play()
}

export function play_move_self() {
    move_self.play()
}

export function play_move_opponent() {
    move_opponent.play()
}

export function play_capture() {
    capture.play()
}

export function play_castle() {
    castle.play()
}

export function play_promote() {
    promote.play()
}

export function play_move_check() {
    move_check.play()
}

export function play_game_end() {
    game_end.play()
}

export function play_illegal() {
    illegal.play()
}