import { practice, study, startElement } from "./constants.js";
import { updateHintText } from "./update.js";
import { getPlayedSelected, getSelected } from "./getters.js";
import { limitedLineId, setFinished, setKeepPlaying } from "./globals.js";
import { difLineBtn, limitLineBtn, keepPlayingBtn } from "./buttons.js";

export function timeoutBtn(btn, time=1) {
    let before = btn.disabled;
    btn.disabled = true;
    setTimeout(()=>{
      btn.disabled = before;
    }, time*1000);
};

export function toggleDifLineBtn(done) {
    if (study) return;
    var difLineBtn = document.getElementById('difLineBtn');
    difLineBtn.innerHTML = done ? 'No Other Lines' : 'Different Line';
    difLineBtn.disabled = done || limitedLineId != '';
};

export function resetButtons() {
    if (practice) {
        $('#skill-label')[0].style.display = 'none';
        $('#skill-input')[0].style.display = 'none';
        keepPlayingBtn[0].style.display = 'none';
        difLineBtn[0].style.display = 'block';
        limitLineBtn[0].style.display = 'block';
        if (limitedLineId != '') {
            limitLineBtn[0].innerHTML = 'Any Line';
            difLineBtn[0].disabled = true;
        } else difLineBtn[0].disabled = false;
    };
    setFinished(false);
    setKeepPlaying(false);
    toggleDifLineBtn();
    updateHintText();
};

export function resetMoveList() {
    if (study) {
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