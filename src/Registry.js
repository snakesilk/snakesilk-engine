class Registry
{
    constructor() {
        this.entries = new Map();
    }

    add(entries) {
        if (!(typeof entries === 'object')) {
            throw new TypeError(`Entries must be Object.`);
        }

        Object.keys(entries).forEach(key => {
            if (this.entries.has(key)) {
                console.warn(`Overwriting "${key}".`);
            }
            this.entries.set(key, entries[key]);
        });
    }

    resolve(key) {
        return this.entries.get(key);
    }
}

module.exports = Registry;
