import { page, startElement } from "./constants.js";
import { updateHintText } from "./update.js";
import { getPlayedSelected } from "./getters.js";

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
    $('#keepPlayingBtn')[0].style.display = 'none';
    toggleDifLineBtn();
    updateHintText();
};

export function resetMoveList() {
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
    getPlayedSelected().classList.remove('played-selected');
    startElement.classList.add('played-selected');
};