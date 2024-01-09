import { config, game } from './globals.js';

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
        if (!( key in d2)) {
            return false;
        };
        if (d1[key] != d2[key]) {
            return false;
        };
    };
    return true;
};

function countPieces() {
    var pos = game.board();
    for (const [key, value] of Object.entries(pieceDict)) {
        pieceDict[key] = 0;
    };
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (pos[i][j] != null) {
                pieceDict[pos[i][j].color + pos[i][j].type.toUpperCase()] += 1;
            };
        };
    };
};

function updateMaterialDif(own) {
    materialDif = 0;
    for (const [key, value] of Object.entries(pieceDict)) {
        if (key[0] == own) {
            materialDif += value * valueDict[key];
        }
        else {
            materialDif -= value * valueDict[key];
        };
    };
};

function removeCapturedPieces() {
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
    var element = document.getElementsByClassName('captured-own');
    if (oldOpp.length > 0) {
        for (let i = 0; i != oldOpp.length; i++) {
            element[0].appendChild(oldOpp[i]);
        };
    };
    var element = document.getElementsByClassName('captured-opp');
    if (oldOwn.length > 0) {
        for (let i = 0; i != oldOwn.length; i++) {
            element[0].appendChild(oldOwn[i]);
        };
    };
};

export function updateCapturedPieces() {
    console.log('Updating captured');
    var own = config.orientation == 'white' ? 'w' : 'b';
    removeCapturedPieces();
    countPieces();
    updateMaterialDif(own);
    for (const [key, value] of Object.entries(pieceDict)) {
        var dif = fullDict[key] - pieceDict[key];
        if (dif) {
            for (let i = 1; i <= dif; i++) {
                var newDiv = document.createElement('div');
                newDiv.classList.add('col-1', 'captured');
                var newImg = document.createElement('img');
                newImg.src = 'static/img/chesspieces/wikipedia/' + key + '.png';
                newImg.style = 'width:30px;height:30px;';
                newDiv.appendChild(newImg);
                var element = document.getElementsByClassName('captured-' + ((own == key[0]) ? 'opp' : 'own'));
                element[0].appendChild(newDiv);
            };
        };
    };
    if (materialDif != 0) {
        var materialScore = document.createElement('span');
        materialScore.classList.add('col-1', 'captured', 'material-dif');
        if (materialDif > 0) {
            var newContent = document.createTextNode('+' + materialDif);
            var element = document.getElementsByClassName('captured-own');
        }
        else {
            var newContent = document.createTextNode('+' + -materialDif);
            var element = document.getElementsByClassName('captured-opp');
        };
        materialScore.appendChild(newContent);
        element[0].appendChild(materialScore);
    };
};