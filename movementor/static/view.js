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
    var id = element.id;
    console.log('Selected ' + id.toString());
    var own = separate_fen(element.getAttribute('data-own'));
    if (own != null) {
        console.log('FEN: ' + own);
    }
    board.position(own, false);
}

const elementIsVisibleInViewport = (el, partiallyVisible = false) => {
    const { top, left, bottom, right } = el.getBoundingClientRect();
    const { innerHeight, innerWidth } = window;
    return partiallyVisible
      ? ((top > 0 && top < innerHeight) ||
          (bottom > 0 && bottom < innerHeight)) &&
          ((left > 0 && left < innerWidth) || (right > 0 && right < innerWidth))
      : top >= 0 && left >= 0 && bottom <= innerHeight && right <= innerWidth;
  };

document.onkeydown = check_key;

function check_key(e) {
    e = e || window.event;
    var old = document.getElementsByClassName('selected');
    if (old.length == 0 && (e.keyCode == '37' || e.keyCode == '38' || e.keyCode == '39' || e.keyCode == '40')) {
        click_update(document.getElementById('0'));
    }
    else {
        if (e.keyCode == '38') {
            console.log('Up arrow');
            var fen = old[0].getAttribute('data-parent');
            if (fen != null) {
                var element = document.querySelectorAll("[data-own='" + fen + "']");
                if (element.length == 0) {
                    console.log('No parent to current selected move');
                }
                else {
                    click_update(element[0]);
                    if (elementIsVisibleInViewport(element[0])) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }
            }
        }
        else if (e.keyCode == '40') {
            console.log('Down arrow');
            var fen = old[0].getAttribute('data-child-2');
            if (fen != null) {
                var element = document.querySelectorAll("[data-own='" + fen + "']");
                if (element.length == 0) {
                    console.log('No variation to current selected move');
                }
                else {
                    click_update(element[0]);
                    if (elementIsVisibleInViewport(element[0])) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }
            }
        }
        else if (e.keyCode == '37') {
            console.log('Left arrow');
            var fen = old[0].getAttribute('data-parent');
            if (fen != null) {
                var element = document.querySelectorAll("[data-own='" + fen + "']");
                if (element.length == 0) {
                    console.log('No parent to current selected move');
                }
                else {
                    click_update(element[0]);
                    if (elementIsVisibleInViewport(element[0])) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }
            }
        }
        else if (e.keyCode == '39') {
            console.log('Right arrow');
            var fen = old[0].getAttribute('data-child-1');
            if (fen != null) {
                var element = document.querySelectorAll("[data-own='" + fen + "']");
                if (element.length == 0) {
                    console.log('No mainline child to current selected move');
                }
                else {
                    click_update(element[0]);
                    if (elementIsVisibleInViewport(element[0])) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    else {
                        console.log('Element is not currently visible')
                    }
                }
            }
        }
        else if (e.keyCode == '32') {
            console.log('Spacebar');
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
                            if (elementIsVisibleInViewport(element[0])) {
                                e.preventDefault();
                                e.stopPropagation();
                            }
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

// window.addEventListener("keydown", function(e) {
//     if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
//         e.preventDefault();
//     }
// }, false);

var config = {
    position: 'start'
}
var board = Chessboard('myBoard', config);