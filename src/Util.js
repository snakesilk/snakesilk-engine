function readOnly(object, spec, configurable = false) {
    Object.keys(spec).forEach(key => {
        Object.defineProperty(object, key, {
            configurable,
            value: spec[key],
            writable: false,
        });
    });
}

module.exports = {
    readOnly,
};
