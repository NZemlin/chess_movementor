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
var finished = false
var last_fen = ''
var other_choices = []
var move_number = 1
var status = ''

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
    console.clear()
    finished = false
    last_fen = ''
    other_choices = []
    move_number = 1
    status = ''
    var element = document.getElementsByClassName('move-list-num')
    for (let i = 0; i < element.length; i++) {
        element[i].hidden = true
    }
    element = document.getElementsByClassName('move-list')
    for (let i = 0; i < element.length; i++) {
        element[i].innerHTML = ''
    }
    config.position = 'start'
    board = Chessboard('myBoard', config)
    game = new Chess()
    game_start.play()
    updateStatus()
    if (game.turn() == 'w' && config.orientation == 'black') {
        window.setTimeout(makeComputerMove, 1000)
    }
})
  
$('#difLineBtn').on('click', function () {
    if (other_choices.length == 0) {
        console.log('No other lines were available')
    }
    else {
        if (game.turn() == 'w' && config.orientation == 'black' || 
            game.turn() == 'b' && config.orientation == 'white') {
                game.undo()
        }
        if (game.turn() == 'w') {
            move_number--
        }
        game.undo()
        board.position(last_fen)
        finished = false
        possibleMoves = other_choices
        window.setTimeout(makeComputerMove, 500)
    }
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

$('#hintBtn').on('click', function () {
    this.innerHTML = this.innerHTML == 'Show Hints' ? 'Hide Hints' : 'Show Hints'
    var hint_element = document.getElementById('hints')
    hint_element.hidden = hint_element.hidden ? false : true
})

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
    if (!finished) {
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
        var color = ''
        var turn = ''
        if (fen != null) {
            var element = document.querySelectorAll("[data-own='" + fen + "']");
            move = element[0].getAttribute('data-uci-move')
            possibleMoves.push(move)
            color = element[0].getAttribute('data-color')
            turn = element[0].getAttribute('data-turn')
        }
        fen = cur.getAttribute('data-child-2')
        while (fen != null) {
            var element = document.querySelectorAll("[data-own='" + fen + "']");
            move = element[0].getAttribute('data-uci-move')
            if (color == element[0].getAttribute('data-color') && turn == element[0].getAttribute('data-turn')) {
                possibleMoves.push(move)
                element = document.querySelectorAll("[data-own='" + fen + "']");
                fen = element[0].getAttribute('data-child-2')
            }
            else {
                break
            }
        }
        if (possibleMoves.length == 0) {
            console.log('This line is finished')
            document.getElementById('status').innerHTML = 'This line is finished';
            finished = true
            possibleMoves = game.moves()
        }
    }
    else {
        possibleMoves = game.moves()
    }
}
updateStatus(false)
console.log('First moves are: ' + possibleMoves)

function makeComputerMove() {
    if (game.game_over()) {
        return
    }
    console.log('Computer moves: ' + possibleMoves)
    var randomIdx = Math.floor(Math.random() * possibleMoves.length)
    move = possibleMoves[randomIdx]
    other_choices = possibleMoves
    other_choices.splice(randomIdx, 1)
    console.log('Other choices were: ' + other_choices)
    last_fen = game.fen()
    var color = game.turn()
    game.move(move)
    board.position(game.fen())
    var element = document.getElementById('n' + move_number)
    element.hidden = false
    element = document.getElementById(color + move_number)
    element.innerHTML = move
    if (game.turn() == 'w') {
        move_number++
    }
    updateStatus(false)
    console.log('Your moves: ' + possibleMoves)
}

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

function onDrop (source, target) {
    // see if the move is legal
    var before = game.fen()
    ownMove = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    })
    var after = game.fen()
    // illegal move
    if (ownMove === null || (!finished && !(possibleMoves.includes(ownMove.san)))) {
        console.log('Move not in prepared opening.  Allowed moves are: ')
        console.log(possibleMoves)
        var hint_element = document.getElementById('hints')
        hint_element.innerHTML = 'Allowed moves are: ' + possibleMoves
        illegal.play()
        if (before != after) {
            game.undo()
        }
        return 'snapback'
    }
    else {
        var color = game.turn() == 'w' ? 'b' : 'w'
        var element = document.getElementById('n' + move_number)
        element.hidden = false
        element = document.getElementById(color + move_number)
        element.innerHTML = ownMove.san
        if (game.turn() == 'w') {
            move_number++
        }
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
    var hint_element = document.getElementById('hints')
    hint_element.innerHTML = 'No hints currently'

    status = ''

    var moveColor = 'White'
    if (game.turn() === 'b') {
        moveColor = 'Black'
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
        else if (move != '') {
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
        if (!finished) {
            document.getElementById('status').innerHTML = status;
        }
  }
  updateAllowedMoves()
}