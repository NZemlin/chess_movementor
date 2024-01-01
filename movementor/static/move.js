import {finished, config, board, game, possibleMoves, condense_fen, fix_ep, updateStatus} from './chess_helper.js'
import {play_illegal} from './sounds.js'

export var page = document.getElementById('page').getAttribute('data-page')
export var last_fen = ''
export var move_number = 1
export var other_choices = []

export function reset_move_vars() {
    last_fen = ''
    other_choices = []
    move_number = 1
}

export function dec_move_num() {
    move_number--
}

export function makeComputerMove() {
    if (!finished) {
        console.log('Making a computer move')
        if (game.game_over()) {
            return
        }
        console.log('Computer moves: ' + possibleMoves)
        var randomIdx = Math.floor(Math.random() * possibleMoves.length)
        var move = possibleMoves[randomIdx]
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
        updateStatus(move)
        console.log('Your moves: ' + possibleMoves)
    }
}

function onDragStartPractice (source, piece, position, orientation) {
    console.log('onDragStartPractice')
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

function onDragStartView (source, piece, position, orientation) {
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

function onDropPractice (source, target) {
    // see if the move is legal
    var before = game.fen()
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    })
    var after = game.fen()
    // illegal move
    if (move === null || (!finished && !(possibleMoves.includes(move.san)))) {
        if (source != target) {
            console.log('Move not in prepared opening.  Allowed moves are: ')
            console.log(possibleMoves)
            var hint_element = document.getElementById('hints')
            hint_element.innerHTML = 'Allowed moves are: ' + possibleMoves
            play_illegal()
        }
        if (before != after) {
            game.undo()
        }
        return 'snapback'
    }
    else {
        console.log('A legal move was played: ' + move.san)
        var color = game.turn() == 'w' ? 'b' : 'w'
        var element = document.getElementById('n' + move_number)
        element.hidden = false
        element = document.getElementById(color + move_number)
        element.innerHTML = move.san
        if (game.turn() == 'w') {
            move_number++
        }
        updateStatus(move.san)
        window.setTimeout(makeComputerMove, 500)
    }
}

function onDropView (source, target) {
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
        if (source != target) {
            console.log('Move not in prepared opening.  Allowed moves are: ')
            console.log(possibleMoves)
            play_illegal()
        }
        if (before != after) {
            game.undo()
        }
        return 'snapback'
    }
    else {
        console.log('A legal move was played: ' + move.san)
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

export function onDragStart(source, piece, position, orientation) {
    return (page == 'practice') ? onDragStartPractice(source, piece, position, orientation) : onDragStartView(source, piece, position, orientation)
}

export function onDrop(source, target) {
    return (page == 'practice') ? onDropPractice(source, target) : onDropView(source, target)
}

export function onSnapEnd () {
    // update the board position after the piece snap
    // for castling, en passant, pawn promotion
    board.position(game.fen())
}