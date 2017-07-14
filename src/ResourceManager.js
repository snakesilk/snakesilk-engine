class ResourceManager
{
    constructor() {
        this._items = new Map();
    }

    _addResource(type, id, object) {
        if (!type) {
            throw new Error('Empty type');
        }

        if (!id) {
            throw new Error('Empty id');
        }

        if (this.has(type, id)) {
            throw new Error(`Resource "${id}" of type ${type} already defined.`);
        }

        if (!this._items.has(type)) {
            this._items.set(type, new Map());
        }

        this._items.get(type).set(id, object);
    }

    addAudio(id, object) {
        return this._addResource('audio', id, object);
    }

    addFont(id, object) {
        return this._addResource('font', id, object);
    }

    addEntity(id, object) {
        return this._addResource('entity', id, object);
    }

    addTexture(id, object) {
        return this._addResource('texture', id, object);
    }

    get(type, id) {
        if (!this.has(type, id)) {
            throw new Error(`No resource "${id}" of type ${type}.`);
        }
        return this._items.get(type).get(id);
    }

    has(type, id) {
        const sub = this._items.get(type);
        return sub ? sub.has(id) : false;
    }
}

module.exports = ResourceManager;
