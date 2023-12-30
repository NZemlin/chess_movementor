import { Chess } from 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.13.4/chess.js';
import {page, onDragStart, onDrop, onSnapEnd} from './move.js'
import * as sounds from './sounds.js'

export var status = ''
export var finished = false
export var possibleMoves = []
export var config = {
    draggable: true,
    dropOffBoard: 'snapback',
    position: 'start',
    orientation: 'white',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
}
export var board = Chessboard('myBoard', config)
export var game = new Chess()

export function reset_helper_vars(only_f=false) {
    finished = false
    if (!only_f) {
        status = ''
        config.position = 'start'
        board = Chessboard('myBoard', config)
        game = new Chess()
    }
}

export function mod_choices(choices) {
    possibleMoves = choices
}

export function new_board() {
    board = Chessboard('myBoard', config)
}

export function fix_ep(fen) {
    console.log(fen)
    var split_fen = fen.split(' ')
    var ep_string = split_fen[3]
    if (ep_string != '-') {
        var square = ep_string[0] + (ep_string[1] == '6' ? '5' : '4')
        var ep = game.get(square)
        var left = null
        var right = null
        if (square[0] != 'a') {
            left = game.get(String.fromCharCode(square[0].charCodeAt(0) - 1) + square[1])
        }
        if (square[0] != 'h') {
            right = game.get(String.fromCharCode(square[0].charCodeAt(0) + 1) + square[1])
        }
        if ((left != null && left.type == 'p' && left.color != ep.color) ||
                right != null && right.type == 'p' && right.color != ep.color) {
                return fen
        }
        else {
            split_fen[3] = '-'
            fen = split_fen.join(' ')
            console.log('Fixed fen: ' + fen)
            return fen
        }
    }
    else {
        return fen
    }
}

export function condense_fen(fen) {
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

function updateAllowedMoves() {
    console.log('Updating allowed moves')
    possibleMoves = []
    if (!finished) {
        console.log('Game is not finished')
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
        console.log('Current element:' + cur.getAttribute('data-uci-move'))
        var fen = cur.getAttribute('data-child-1');
        var color = ''
        var turn = ''
        if (fen != null) {
            var element = document.querySelectorAll("[data-own='" + fen + "']");
            if (element[0].getAttribute('data-own') == cur.getAttribute('data-own')) {
                console.log("No more data-child-1's")
            }
            else {
                var move = element[0].getAttribute('data-uci-move')
                console.log('data-child-1 of ' + cur.getAttribute('data-uci-move') + ' is ' + element[0].getAttribute('data-uci-move'))
                possibleMoves.push(move)
                color = element[0].getAttribute('data-color')
                turn = element[0].getAttribute('data-turn')
            }
        }
        fen = cur.getAttribute('data-child-2')
        while (fen != null) {
            if (element[0].getAttribute('data-own') == fen) {
                console.log("No more data-child-2's")
                break
            }
            var element = document.querySelectorAll("[data-own='" + fen + "']");
            console.log('Next data-child-2 is ' + element[0].getAttribute('data-uci-move'))
            move = element[0].getAttribute('data-uci-move')
            if (color == element[0].getAttribute('data-color') && turn == element[0].getAttribute('data-turn')) {
                possibleMoves.push(move)
                element = document.querySelectorAll("[data-own='" + fen + "']");
                fen = element[0].getAttribute('data-child-2')
            }
            else {
                console.log("No more data-child-2's")
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

export function updateStatus(move='') {
    console.log('Updating status')
    if (page == 'practice') {
        var hint_element = document.getElementById('hints')
        hint_element.innerHTML = 'No hints currently'
    }

    status = ''

    var moveColor = game.turn() === 'w' ? 'White' : 'Black'
    if (game.in_checkmate()) {
        sounds.play_game_end()
        status = 'Game over, ' + moveColor + ' is in checkmate.'
    }
    else if (game.in_draw()) {
        status = 'Game over, drawn position'
    }
    else if (game.in_check()) {
        sounds.play_move_check()
        status += ', ' + moveColor + ' is in check'
    }
    else {
        if (move) {
            if (move[-2] == '=') {
                sounds.play_promote()
            }
            else if (move.includes('x')) {
                sounds.play_capture()
            }
            else if (move[0] == 'O') {
                sounds.play_castle()
            }
            else if (game.turn() == config.orientation) {
                sounds.play_move_self()
            }
            else {
                sounds.play_move_opponent()
            }
        }
        status = moveColor + ' to move'
        if (!finished) {
            document.getElementById('status').innerHTML = status;
        }
  }
  updateAllowedMoves()
}

updateStatus()