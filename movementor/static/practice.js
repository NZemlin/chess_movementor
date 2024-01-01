import {play_game_start} from './sounds.js'
import {reset_helper_vars, mod_choices, new_board, config, board, game, swapCapturedPieceImgs, updateStatus} from './chess_helper.js'
import {reset_move_vars, dec_move_num, makeComputerMove, last_fen, other_choices} from './move.js'

$('#restartBtn').on('click', function() {
    console.clear()
    var element = document.getElementsByClassName('move-list-num')
    for (let i = 0; i < element.length; i++) {
        element[i].hidden = true
    }
    element = document.getElementsByClassName('move-list')
    for (let i = 0; i < element.length; i++) {
        element[i].innerHTML = ''
    }
    reset_helper_vars()
    reset_move_vars()
    play_game_start()
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
            dec_move_num()
        }
        game.undo()
        board.position(last_fen)
        reset_helper_vars(true)
        mod_choices(other_choices)
        window.setTimeout(makeComputerMove, 500)
    }
})

$('#switchBtn').on('click', function () {
    config.orientation = config.orientation == 'white' ? 'black' : 'white'
    config.position = game.fen()
    swapCapturedPieceImgs()
    new_board()
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