const SyncPromise = require('./SyncPromise');

function doFor(events, event) {
    return function doFor(duration, callback) {
        if (duration <= 0) {
            if (callback) {
                callback(0, 1);
            }
            return SyncPromise.resolve();
        }

        let elapsed = 0;
        let progress = 0;
        return new SyncPromise(resolve => {
            function doForWrapper(dt, total, tick) {
                elapsed += dt;
                progress = elapsed / duration;
                if (progress >= 1) {
                    progress = 1;
                    events.unbind(event, doForWrapper);
                }
                if (callback) {
                    callback(elapsed, progress);
                }
                if (progress === 1) {
                    resolve({
                        elapsed,
                        tick,
                        offset: elapsed - duration,
                        total: total,
                    });
                }
            }
            events.bind(event, doForWrapper);
        });
    };
}

function waitFor(events, event) {
    const doForWrapper = doFor(events, event);
    return function waitFor(seconds) {
        return doForWrapper(seconds);
    };
}

module.exports = {
    doFor,
    waitFor,
};
