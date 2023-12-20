import { Chess } from 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.13.4/chess.js'

let game_start = new Audio('./static/audio/game-start.mp3');
let move_self = new Audio('./static/audio/move-self.mp3');
let move_opponent = new Audio('./static/audio/move-opponent.mp3');
let capture = new Audio('./static/audio/capture.mp3');
let castle = new Audio('./static/audio/castle.mp3');
let promote = new Audio('./static/audio/promote.mp3');
let move_check = new Audio('./static/audio/move-check.mp3');
let game_end = new Audio('./static/audio/game-end.mp3');
let illegal = new Audio('./static/audio/illegal.mp3');

var move = ''
var ownMove = ''
var possibleMoves = []

var config = {
    draggable: true,
    dropOffBoard: 'snapback',
    position: 'start',
    orientation: 'white',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
}

var board = Chessboard('myBoard', config)
var game = new Chess()
game_start.autoplay = true
game_start.play()

$('#restartBtn').on('click', function() {
    config.position = 'start'
    board = Chessboard('myBoard', config)
    game = new Chess()
    game_start.play()
    if (game.turn() == 'w' && config.orientation == 'black') {
        window.setTimeout(makeComputerMove, 500)
    }
})

$('#backBtn').on('click', function () {
    
})
  
$('#difLineBtn').on('click', function () {
    
})

$('#switchBtn').on('click', function () {
    if (config.orientation == 'white') {
        config.orientation = 'black'
    }
    else {
        config.orientation = 'white'
    }
    config.position = game.fen()
    board = Chessboard('myBoard', config)
    if (game.turn() == 'w' && config.orientation == 'black' || 
        game.turn() == 'b' && config.orientation == 'white') {
        window.setTimeout(makeComputerMove, 500)
    }
})

function separate_fen(fen) {
    var separated = '';
    for (let i = 0; i < fen.length; i++) {
        if (fen[i] == '_') {
            separated += ' ';
        }
        else {
            separated += fen[i];
        }
    }
    return(separated);
}

function condense_fen(fen) {
    var condensed = '';
    for (let i = 0; i < fen.length; i++) {
        if (fen[i] == ' ') {
            condensed += '_';
        }
        else {
            condensed += fen[i];
        }
    }
    return(condensed);
}

function fix_ep(fen) {
    var spaces = 0
    for (let i = fen.length - 1; i >= 0; i--) {
        if (spaces == 2) {
            fen = fen.slice(0, i - 1) + '-' + fen.slice(i + 1)
            return fen
        }
        if (fen[i] == ' ') {
            spaces++;
        }
    }
}

function updateAllowedMoves () {
    possibleMoves = []
    console.log(game.fen())
    if (game.fen() == 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
        possibleMoves = [document.getElementById('0').getAttribute('data-uci-move')]
        return
    }
    else {
        var cur = document.querySelectorAll("[data-own='" + condense_fen(game.fen()) + "']");
        if (cur.length == 0) {
            var cur = document.querySelectorAll("[data-own='" + condense_fen(fix_ep(game.fen())) + "']");
        }
        cur = cur[0]
    }
    var fen = cur.getAttribute('data-child-1');
    if (fen != null) {
        var element = document.querySelectorAll("[data-own='" + fen + "']");
        move = element[0].getAttribute('data-uci-move')
        possibleMoves.push(move)
    }
    fen = cur.getAttribute('data-child-2')
    while (fen != null) {
        var element = document.querySelectorAll("[data-own='" + fen + "']");
        move = element[0].getAttribute('data-uci-move')
        possibleMoves.push(move)
        element = document.querySelectorAll("[data-own='" + fen + "']");
        fen = element[0].getAttribute('data-child-2')
    }
    console.log(possibleMoves)
}
updateAllowedMoves()

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
    if (game.game_over()) {
        return false
  }
  // only pick up pieces for own side
    if ((config.orientation === 'white' && piece.search(/^b/) !== -1 && game.turn() === 'w') || 
        (config.orientation === 'black' && piece.search(/^w/) !== -1 && game.turn() === 'b')) {
        return false
  }
}

function makeComputerMove() {
    var randomIdx = Math.floor(Math.random() * possibleMoves.length)
    move = possibleMoves[randomIdx]
    game.move(move)
    board.position(game.fen())
    updateStatus(false)
}

function onDrop (source, target) {
    // see if the move is legal
    ownMove = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    })

    // illegal move
    if (ownMove === null || !(possibleMoves.includes(ownMove.san))) {
        illegal.play(0)
        return 'snapback'
    }
    else {
        updateStatus(true)
        window.setTimeout(makeComputerMove, 500)
    }
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
    board.position(game.fen())
}

function updateStatus (own) {
    var status = ''

    var moveColor = 'white'
    if (game.turn() === 'b') {
        moveColor = 'black'
    }

    // checkmate?
    if (game.in_checkmate()) {
        game_end.play()
        status = 'Game over, ' + moveColor + ' is in checkmate.'
    }

    // draw?
    else if (game.in_draw()) {
        status = 'Game over, drawn position'
    }

    // check?
    else if (game.in_check()) {
        move_check.play()
        status += ', ' + moveColor + ' is in check'
    }

    // game still on
    else {

        if (own) {
            if (ownMove.san[-2] == '=') {
                promote.play()
            }
            else if (ownMove.san.includes('x')) {
                capture.play()
            }
            else if (ownMove.san[0] == 'O') {
                castle.play()
            }
            else {
                move_self.play()
            }
        }
        else {
            if (move[-2] == '=') {
                promote.play()
            }
            else if (move.includes('x')) {
                capture.play()
            }
            else if (move[0] == 'O') {
                castle.play()
            }
            else {
                move_opponent.play()
            }
        }
    status = moveColor + ' to move'
  }
  updateAllowedMoves()
}