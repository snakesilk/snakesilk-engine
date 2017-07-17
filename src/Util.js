function readOnly(object, spec) {
    Object.keys(spec).forEach(key => {
        Object.defineProperty(object, key, {
            value: spec[key],
            writable: false,
        });
    });
}

module.exports = {
    readOnly,
};
