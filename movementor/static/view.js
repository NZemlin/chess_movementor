import {config, board, game, mod_finished, updateStatus, swapCapturedPieceImgs, new_board} from './chess_helper.js'

$('#switchBtn').on('click', function () {
    config.orientation = config.orientation == 'white' ? 'black' : 'white'
    config.position = game.fen()
    swapCapturedPieceImgs()
    new_board()
})

function elementInViewport(element) {

    var bounding = element.getBoundingClientRect();

    return (bounding.top >= 0 &&
        bounding.left >= 0 &&
        bounding.right <= (window.innerWidth*.75 || document.documentElement.clientWidth) &&
        bounding.bottom <= (window.innerHeight*.75 || document.documentElement.clientHeight))
}

function click_update(element) {
    var old = document.getElementsByClassName('selected');
    if (old.length > 0) {
        if (old[0] == element) {
            return
        }
        for (let i = 0; i < old.length; i++) {
            old[i].classList.remove('selected');
        }
    }
    element.classList.add('selected');
    var own = element.getAttribute('data-own').replace(/_/g, ' ');
    mod_finished(element.getAttribute('data-own') == element.getAttribute('data-child-1'))
    game.load(own)
    board.position(game.fen());
    if (!elementInViewport(element)) {
        element.scrollIntoView({ 
            behavior: 'smooth' 
        })
    }
    updateStatus(element.getAttribute('data-uci-move'))
}

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

function dontScroll(e) {
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}

document.onkeydown = check_key;

window.addEventListener("keydown", dontScroll, false);

var moves = document.getElementsByClassName('move')
for (let i = 0; i < moves.length; i++) {
    moves[i].addEventListener('click', function() {
        click_update(moves[i])
    })
}