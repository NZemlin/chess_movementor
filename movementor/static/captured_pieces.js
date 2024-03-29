import { config } from './game.js';
import { getBoardFen } from './getters.js';
import { createChessPiece } from './visual_helpers.js';

var materialDif = 0;

var pieceDict = {
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
};

var fullDict = {
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
};

var valueDict = {
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
};

function equalDictionaries(d1, d2) {
    for (var key in d1) {
        if (!(key in d2)) return false;
        if (d1[key] != d2[key]) return false;
    };
    return true;
};

function countPieces() {
    var curFen = getBoardFen().split('_')[0];
    for (const [key, value] of Object.entries(pieceDict)) {
        let piece = key[0] == 'w' ? key[1] : key[1].toLowerCase();
        pieceDict[key] = curFen.split(piece).length - 1;
    };
};

function updateMaterialDif(own) {
    countPieces();
    materialDif = 0;
    for (const [key, value] of Object.entries(pieceDict)) {
        materialDif += (key[0] == own) ? value * valueDict[key] : -value * valueDict[key];
    };
};

export function removeCapturedPieces() {
    if (!equalDictionaries(pieceDict, fullDict)) {
        var elements = document.getElementsByClassName('captured');
        if (elements.length > 0) {
            for (let i = 0; i != elements.length;) {
                elements[i].remove();
            };
        };
    };
};

export function swapCapturedPieces() {
    var oldOpp = Array.from(document.getElementsByClassName('captured-opp')[0].getElementsByTagName('div')).concat(
                  Array.from(document.getElementsByClassName('captured-opp')[0].getElementsByTagName('span')));
    var oldOwn = Array.from(document.getElementsByClassName('captured-own')[0].getElementsByTagName('div')).concat(
                  Array.from(document.getElementsByClassName('captured-own')[0].getElementsByTagName('span')));
    removeCapturedPieces();
    var element = document.getElementsByClassName('captured-own')[0];
    if (oldOpp) {
        for (let i = 0; i != oldOpp.length; i++) {
            element.appendChild(oldOpp[i]);
        };
    };
    var element = document.getElementsByClassName('captured-opp')[0];
    if (oldOwn) {
        for (let i = 0; i != oldOwn.length; i++) {
            element.appendChild(oldOwn[i]);
        };
    };
};

export function updateCapturedPieces() {
    // console.log('Updating captured pieces');
    var own = config.orientation == 'white' ? 'w' : 'b';
    removeCapturedPieces();
    updateMaterialDif(own);
    for (const [key, value] of Object.entries(pieceDict)) {
        var dif = fullDict[key] - pieceDict[key];
        if (dif) {
            let numOfPawns = 0;
            if (key[1].toLowerCase() == 'p') numOfPawns = dif - 1;
            for (let i = 1; i <= dif; i++) {
                var newDiv = document.createElement('div');
                newDiv.classList.add('col-1', 'captured');
                var newImg = createChessPiece(key[0], key[1], '', 30)
                newDiv.appendChild(newImg);
                if (numOfPawns) {
                    newDiv.style.marginRight = '-3.5px';
                    numOfPawns--;
                };
                document.getElementsByClassName('captured-' + ((own == key[0]) ? 'opp' : 'own'))[0].appendChild(newDiv);
            };
        };
    };
    if (materialDif != 0) {
        var side = materialDif > 0 ? 'own' : 'opp';
        materialDif *= materialDif < 0 ? -1 : 1;
        var materialScore = document.createElement('span');
        materialScore.classList.add('col-1', 'captured', 'material-dif');
        var capturedRow = document.getElementsByClassName('captured-' + side)[0];
        if (capturedRow.lastChild.lastChild.getAttribute('data-piece')[1] != 'P') {
            materialScore.style.paddingLeft = '15px';
        };
        materialScore.appendChild(document.createTextNode('+' + materialDif));
        document.getElementsByClassName('captured-' + side)[0].appendChild(materialScore);
    };
};