import { Chess } from 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.13.4/chess.js';

let game_start = new Audio('./static/audio/game-start.mp3');
let move_self = new Audio('./static/audio/move-self.mp3');
let move_opponent = new Audio('./static/audio/move-opponent.mp3');
let capture = new Audio('./static/audio/capture.mp3');
let castle = new Audio('./static/audio/castle.mp3');
let promote = new Audio('./static/audio/promote.mp3');
let move_check = new Audio('./static/audio/move-check.mp3');
let game_end = new Audio('./static/audio/game-end.mp3');
let illegal = new Audio('./static/audio/illegal.mp3');

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

var possibleMoves = []
var last_fen = ''
var status = ''

var moves = document.getElementsByClassName('move')
for (let i = 0; i < moves.length; i++) {
    moves[i].addEventListener('click', function() {
        click_update(moves[i])
    })
}

$('#switchBtn').on('click', function () {
    if (config.orientation == 'white') {
        config.orientation = 'black'
    }
    else {
        config.orientation = 'white'
    }
    config.position = game.fen()
    board = Chessboard('myBoard', config)
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
            if (fen[i] != '-') {
                var square = fen[i - 1] + fen[i]
                var ep = game.get(square)
                var left = null
                var right = null
                if (square[0] != 'a') {
                    left = game.get(String.fromCharCode(square[0].charCodeAt(0) - 1) + fen[1])
                }
                if (square[0] != 'h') {
                    right = game.get(String.fromCharCode(square[0].charCodeAt(0) + 1) + fen[1])
                }
                if ((left != null && left.type == 'p' && left.color != ep.color) ||
                     right != null && right.type == 'p' && left.color != ep.color) {
                        return fen
                }
                else {
                    fen = fen.slice(0, i - 1) + '-' + fen.slice(i + 1)
                    return fen
                }
            }
            else {
                return fen
            }
            
        }
        if (fen[i] == ' ') {
            spaces++;
        }
    }
    return fen
}

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

function click_update(element) {
    var old = document.getElementsByClassName('selected');
    if (old.length > 0) {
        for (let i = 0; i < old.length; i++) {
            old[i].classList.remove('selected');
        }
    }
    element.classList.add('selected');
    var own = separate_fen(element.getAttribute('data-own'));
    game.load(own)
    board.position(game.fen());
    updateStatus(element.getAttribute('data-uci-move'))
}

document.onkeydown = check_key;

function check_key(e) {
    e = e || window.event;
    var old = document.getElementsByClassName('selected');
    if (old.length == 0 && (e.keyCode == '37' || e.keyCode == '38' || e.keyCode == '39' || e.keyCode == '40')) {
        click_update(document.getElementById('0'));
    }
    else {
        if (e.keyCode == '38') {
            var fen = old[0].getAttribute('data-parent');
            if (fen != null) {
                var element = document.querySelectorAll("[data-own='" + fen + "']");
                if (element.length == 0) {
                    console.log('No parent to current selected move');
                }
                else {
                    click_update(element[0]);
                }
            }
        }
        else if (e.keyCode == '40') {
            var fen = old[0].getAttribute('data-child-2');
            if (fen != null) {
                var element = document.querySelectorAll("[data-own='" + fen + "']");
                if (element.length == 0) {
                    console.log('No variation to current selected move');
                }
                else {
                    click_update(element[0]);
                }
            }
        }
        else if (e.keyCode == '37') {
            var fen = old[0].getAttribute('data-parent');
            if (fen != null) {
                var element = document.querySelectorAll("[data-own='" + fen + "']");
                if (element.length == 0) {
                    console.log('No parent to current selected move');
                }
                else {
                    click_update(element[0]);
                }
            }
        }
        else if (e.keyCode == '39') {
            var fen = old[0].getAttribute('data-child-1');
            if (fen != null) {
                var element = document.querySelectorAll("[data-own='" + fen + "']");
                if (element.length == 0) {
                    console.log('No mainline child to current selected move');
                }
                else {
                    click_update(element[0]);
                }
            }
        }
        else if (e.keyCode == '32') {
            var fen = old[0].getAttribute('data-parent');
            if (fen != null) {
                while(true) {
                    var element = document.querySelectorAll("[data-own='" + fen + "']");
                    if (element.length == 0) {
                        console.log('No parent to current selected move');
                    }
                    else { 
                        var mainline = element[0].getAttribute('data-mainline');
                        if (mainline != null) {
                            click_update(element[0]);
                            break;
                        }
                        else {
                            fen = element[0].getAttribute('data-parent');
                        }
                    }
                    
                }
            }
        }
    }
}

function updateAllowedMoves () {
    possibleMoves = []
    if (game.fen() == 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
        possibleMoves = [document.getElementById('0').getAttribute('data-uci-move')]
        return
    }
    else {
        var cur = document.querySelectorAll("[data-own='" + condense_fen(fix_ep(game.fen())) + "']");
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
        var move = element[0].getAttribute('data-uci-move')
        possibleMoves.push(move)
        color = element[0].getAttribute('data-color')
        turn = element[0].getAttribute('data-turn')
    }
    fen = cur.getAttribute('data-child-2')
    while (fen != null) {
        var element = document.querySelectorAll("[data-own='" + fen + "']");
        var move = element[0].getAttribute('data-uci-move')
        if (color == element[0].getAttribute('data-color') && turn == element[0].getAttribute('data-turn')) {
            possibleMoves.push(move)
            element = document.querySelectorAll("[data-own='" + fen + "']");
            fen = element[0].getAttribute('data-child-2')
        }
        else {
            break
        }
    }
}
updateStatus()
console.log('First moves are: ' + possibleMoves)

function onDragStart (source, piece, position, orientation) {
    // do not pick up pieces if the game is over
        if (game.game_over()) {
            return false
    }
    // only pick up pieces for the side to move
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false
    }
    last_fen = condense_fen(fix_ep(game.fen()))
}

function onDrop (source, target) {
    // see if the move is legal
    var before = game.fen()
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    })
    var after = game.fen()
    // illegal move
    if (move === null || !(possibleMoves.includes(move.san))) {
        console.log('Move not in prepared opening.  Allowed moves are: ')
        console.log(possibleMoves)
        illegal.play()
        if (before != after) {
            game.undo()
        }
        return 'snapback'
    }
    else {
        var old = document.getElementsByClassName('selected');
        if (old.length > 0) {
            for (let i = 0; i < old.length; i++) {
                old[i].classList.remove('selected');
            }
        }
        var element = document.querySelectorAll("[data-parent='" + last_fen + "']")
        if (element.length == 0) {
            element = [document.getElementById('0')]
        }
        for (let i = 0; i < element.length; i++) {
            if (move.san == element[i].getAttribute('data-uci-move')) {
                element[i].classList.add('selected')
                break
            }
        }
        updateStatus(move.san)
    }
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
    board.position(game.fen())
}

function updateStatus (move = '') {
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
    else if (move != '') {
        if (move == '=') {
            promote.play()
        }
        else if (move.includes('x')) {
            capture.play()
        }
        else if (move == 'O') {
            castle.play()
        }
        else if (moveColor.toLowerCase()[0] != game.turn) {
            move_self.play()
        }
        else {
            move_opponent.play()
        }
    }
    status = moveColor + ' to move'
    document.getElementById('status').innerHTML = status;
  updateAllowedMoves()
}