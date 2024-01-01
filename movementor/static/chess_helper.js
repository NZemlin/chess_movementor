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

var material_dif = 0

var piece_dict = {
    'wP': 0,
    'wB': 0,
    'wN': 0,
    'wR': 0,
    'wQ': 0,
    'wK': 0,
    'bP': 0,
    'bB': 0,
    'bN': 0,
    'bR': 0,
    'bQ': 0,
    'bK': 0,
}

var full_dict = {
    'wP': 8,
    'wB': 2,
    'wN': 2,
    'wR': 2,
    'wQ': 1,
    'wK': 1,
    'bP': 8,
    'bB': 2,
    'bN': 2,
    'bR': 2,
    'bQ': 1,
    'bK': 1,
}

var value_dict = {
    'wP': 1,
    'wB': 3,
    'wN': 3,
    'wR': 5,
    'wQ': 9,
    'wK': 0,
    'bP': 1,
    'bB': 3,
    'bN': 3,
    'bR': 5,
    'bQ': 9,
    'bK': 0,
}

function equalDictionaries(d1, d2) {
    for (var key in d1) {
        if (!( key in d2)) {
            return false
        }
        if (d1[key] != d2[key]) {
            return false
        }
    }
    return true
}

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

export function mod_finished(done) {
    finished = done
}

export function new_board() {
    board = Chessboard('myBoard', config)
}

export function fix_ep(fen) {
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
            if (element[0].getAttribute('data-own') == cur.getAttribute('data-own')) {
            }
            else {
                var move = element[0].getAttribute('data-uci-move')
                possibleMoves.push(move)
                color = element[0].getAttribute('data-color')
                turn = element[0].getAttribute('data-turn')
            }
        }
        fen = cur.getAttribute('data-child-2')
        while (fen != null) {
            if (element[0].getAttribute('data-own') == fen) {
                break
            }
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
        }
    }
}

function countPieces() {
    var pos = game.board()

    piece_dict = {
        'wP': 0,
        'wB': 0,
        'wN': 0,
        'wR': 0,
        'wQ': 0,
        'wK': 0,
        'bP': 0,
        'bB': 0,
        'bN': 0,
        'bR': 0,
        'bQ': 0,
        'bK': 0,
    }

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (pos[i][j] != null) {
                piece_dict[pos[i][j].color + pos[i][j].type.toUpperCase()] += 1
            }
        }
    }
}

function updateMaterialDif(own) {
    material_dif = 0
    for (const [key, value] of Object.entries(piece_dict)) {
        if (key[0] == own) {
            material_dif += value * value_dict[key]
        }
        else {
            material_dif -= value * value_dict[key]
        }
    }
}

function removeCapturedPieceImgs() {
    if (!equalDictionaries(piece_dict, full_dict)) {
        var elements = document.getElementsByClassName('captured')
        if (elements.length > 0) {
            for (let i = 0; i != elements.length;) {
                elements[i].remove()
            }
        }
    }
}

export function swapCapturedPieceImgs() {
    var old_opp = Array.from(document.getElementsByClassName('captured-opp')[0].getElementsByTagName('div')).concat(
                  Array.from(document.getElementsByClassName('captured-opp')[0].getElementsByTagName('span')))
    var old_own = Array.from(document.getElementsByClassName('captured-own')[0].getElementsByTagName('div')).concat(
                  Array.from(document.getElementsByClassName('captured-own')[0].getElementsByTagName('span')))
    removeCapturedPieceImgs()
    var element = document.getElementsByClassName('captured-own')
    if (old_opp.length > 0) {
        for (let i = 0; i != old_opp.length; i++) {
            element[0].appendChild(old_opp[i])
        }
    }
    var element = document.getElementsByClassName('captured-opp')
    if (old_own.length > 0) {
        for (let i = 0; i != old_own.length; i++) {
            element[0].appendChild(old_own[i])
        }
    }
}

function updateCaptured() {
    console.log('Updating captured')
    var own = config.orientation == 'white' ? 'w' : 'b'

    removeCapturedPieceImgs()
    countPieces()
    updateMaterialDif(own)
    
    for (const [key, value] of Object.entries(piece_dict)) {
        var dif = full_dict[key] - piece_dict[key]
        if (dif) {
            for (let i = 1; i <= dif; i++) {
                var newDiv = document.createElement('div')
                newDiv.classList.add('col-1', 'captured')
                var newImg = document.createElement('img')
                newImg.src = 'static/img/chesspieces/wikipedia/' + key + '.png'
                newImg.style = 'width:30px;height:30px;'
                newDiv.appendChild(newImg)
                var element = document.getElementsByClassName('captured-' + ((own == key[0]) ? 'opp' : 'own'))
                element[0].appendChild(newDiv)
            }
        }
    }

    if (material_dif != 0) {
        var material_score = document.createElement('span')
        material_score.classList.add('col-1', 'captured', 'material-dif')
        if (material_dif > 0) {
            var newContent = document.createTextNode('+' + material_dif);
            var element = document.getElementsByClassName('captured-own')
        }
        else {
            var newContent = document.createTextNode('+' + -material_dif);
            var element = document.getElementsByClassName('captured-opp')
        }
        material_score.appendChild(newContent)
        element[0].appendChild(material_score)
    }
}

export function updateStatus(move='') {
    console.log('Updating status')
    if (page == 'practice' && !finished) {
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
        else {
            document.getElementById('status').innerHTML = 'This line is finished';
        }
    }
    updateCaptured()
    updateAllowedMoves()
    console.log('----------------------------------------------------')
}

updateStatus()