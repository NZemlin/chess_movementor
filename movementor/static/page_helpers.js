import { page, startElement } from "./constants.js";
import { updateHintText } from "./update.js";
import { getPlayedSelected, getSelected } from "./getters.js";
import { setFinished, setKeepPlaying } from "./globals.js";

export function timeoutBtn(btn, time=1) {
    btn.disabled = true;
    setTimeout(()=>{
      btn.disabled = false;
    }, time*1000);
};

export function toggleDifLineBtn(done) {
    if (page == 'study') return;
    var difLineBtn = document.getElementById('difLineBtn');
    difLineBtn.innerHTML = done ? 'No Other Lines' : 'Different Line';
    difLineBtn.disabled = done;
};

export function resetButtons() {
    if (page == 'practice') {
        $('#skill-label')[0].style.display = 'none';
        $('#skill-input')[0].style.display = 'none';
        $('#keepPlayingBtn')[0].style.display = 'none';
        $('#difLineBtn')[0].style.display = 'block';
    };
    setFinished(false);
    setKeepPlaying(false);
    toggleDifLineBtn();
    updateHintText();
};

export function resetMoveList() {
    if (page == 'study') {
        getSelected().classList.remove('selected');
        startElement.classList.add('selected');
        return;
    };
    var nums = document.getElementsByClassName('move-list-num');
    for (let i = 0; i < nums.length; i++) {
        nums[i].hidden = true;
    };
    var playedMoves = document.getElementsByClassName('played-move');
    for (let i = 0; i != playedMoves.length; i++) {
        playedMoves[i].innerHTML = '';
        playedMoves[i].style.visibility = 'hidden';
        playedMoves[i].setAttribute('data-fen', '');
        playedMoves[i].setAttribute('data-source', '');
        playedMoves[i].setAttribute('data-target', '');
        playedMoves[i].setAttribute('data-eval', '');
    };
    var darkRows = document.getElementsByClassName('dark-row');
    for (let i = 0; i < darkRows.length;) {
        darkRows[i].classList.remove('dark-row');
    };
    getPlayedSelected().classList.remove('played-selected');
    startElement.classList.add('played-selected');
};