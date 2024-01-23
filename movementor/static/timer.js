var timerId;

onmessage = function (event) {
    if (event.data === 'evaluate') {
        if (timerId) clearTimeout(timerId);
        timerId = setTimeout(function () {
            postMessage('evaluate');
        }, 1000);
    };
};