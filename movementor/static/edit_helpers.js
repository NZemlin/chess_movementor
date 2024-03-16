export function toHex(s) {
    return Array.from(s)
        .map(function(c) {
            return c.charCodeAt(0) < 128
                ? c.charCodeAt(0).toString(16)
                : encodeURIComponent(c)
                    .replace(/%/g, "")
                    .toLowerCase();
        })
        .join("");
};

export function fromHex(s) {
    return s.length == 0
        ? ""
        : decodeURIComponent("%" + (s.match(/.{1,2}/g) || []).join("%"));
};

export const encodeComment = function(s) {
    s = s.replace(new RegExp(mask("\r?\n"), "g"), " ");
    return `{${toHex(s.slice(1, s.length - 1))}}`;
};

export const decodeComment = function(s) {
    if (s.startsWith("{") && s.endsWith("}")) {
        return fromHex(s.slice(1, s.length - 1));
    };
};

export function turnNumber(moves, idx) {
    let spaces = 0;
    let openParenCount = 0;
    for (let i = 0; i != idx; i++) {
        if (moves[i] == '{') {
            while (moves[i] != '}') {
                i++;
            };
            i++;
            spaces--;
        };
        if (moves[i] == '(') {
            openParenCount++;
            while (openParenCount != 0) {
                i++;
                if (moves[i] == '(') openParenCount++;
                if (moves[i] == ')') openParenCount--;
            };
            spaces--;
        };
        if (moves[i] == ' ') spaces++;
    };
    return Math.ceil(spaces/3);
};

export function firstDifIndex(s1, s2) {
    if (s1 == s2) return -1;
    let len = Math.min(s1.length, s2.length);
    let lastSpace = 0;
    let s1Offset = 0;
    let s2Offset = 0;
    let openParenCount = 0;
    for (let i = 0; i != len; i++) {
        if (s1[i + s1Offset] == ' ') lastSpace = i;
        if (s1[i + s1Offset] != s2[i + s2Offset]) {
            if (s1[i + s1Offset] == '(') {
                openParenCount++;
                while (openParenCount != 0) {
                    s1Offset++;
                    if (s1[i + s1Offset] == '(') openParenCount++;
                    if (s1[i + s1Offset] == ')') openParenCount--;
                };
                s1Offset += 2;
                i--;
                lastSpace = i;
            } else if (s2[i + s2Offset] == '(') {
                openParenCount++;
                while (openParenCount != 0) {
                    s2Offset++;
                    if (s2[i + s2Offset] == '(') openParenCount++;
                    if (s2[i + s2Offset] == ')') openParenCount--;
                };
                s2Offset += 2;
                i--;
                lastSpace = i;
            } else return [lastSpace, s1Offset, s2Offset];
        };
    };
};

export function fixWhiteComments(pgn) {
    let openBraceCount = 0;
    let lastSpaceOrParen = -1;
    let curTurn = '0';
    let nums = '0123456789';
    for (let i = 0; i != pgn.length; i++) {
        if (' ('.includes(pgn[i])) lastSpaceOrParen = i;
        else if (pgn[i] == '{') openBraceCount++;
        else if (pgn[i] == '.' &&  openBraceCount == 0) {
            if (nums.includes(pgn[i-1])) curTurn = pgn.slice(lastSpaceOrParen + 1, i);
        } else if (pgn[i] == '}' && i != pgn.length - 1) {
            openBraceCount--;
            while (pgn[i] != ' ') {
                i++;
            };
            if (!(nums+'(').includes(pgn[i + 1])) {
                pgn = pgn.slice(0, i + 1) + curTurn + '... ' + pgn.slice(i + 1);
                i += (curTurn + '... ').length;
            } else i--;
        };
    };
    return pgn;
};