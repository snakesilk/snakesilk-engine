'use strict';

Engine.ResourceManager =
class ResourceManager
{
    constructor()
    {
        this.EVENT_ADDED = 'event-added';

        this.events = new Engine.Events();
        this.timeout = 1000;

        this._items = Object.create(null);
    }
    _addResource(type, id, object)
    {
        if (!type) {
            throw new Error('Empty type');
        }
        if (!id) {
            throw new Error('Empty id');
        }
        if (!this._items[type]) {
            this._items[type] = Object.create(null);
        }
        if (this._items[type][id]) {
            throw new Error("Object " + id + " already defined");
        }

        this._items[type][id] = object;

        this.events.trigger(this.EVENT_ADDED, [
            type,
            id,
            object,
        ]);
    }
    addAudio(id, object)
    {
        return this._addResource('audio', id, object);
    }
    addFont(id, object)
    {
        return this._addResource('font', id, object);
    }
    addObject(id, object)
    {
        return this._addResource('object', id, object);
    }
    addTexture(id, object)
    {
        return this._addResource('texture', id, object);
    }
    createImporter(type) {
        return (objects) => {
            Object.keys(objects).forEach(id => {
                this._addResource(type, id, objects[id]);
            });
        };
    }
    getAsync(type, id) {
        if (this.has(type, id)) {
            return Promise.resolve(this.get(type, id));
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.events.unbind(this.EVENT_ADDED, listener);
                reject(new Error(`Timeout while waiting for resource "${id}" of type "${type}"`));
            }, this.timeout);

            const listener = (_type, _id, item) => {
                if (_type === type && _id === id) {
                    this.events.unbind(this.EVENT_ADDED, listener);
                    clearTimeout(timeout);
                    resolve(item);
                }
            };
            this.events.bind(this.EVENT_ADDED, listener);
        });
    }
    get(type, id)
    {
        if (this._items[type] && this._items[type][id]) {
            return this._items[type][id];
        }
        throw new Error(`No resource "${id}" of type "${type}"`);
    }
    has(type, id)
    {
        return this._items[type] !== undefined &&
               this._items[type][id] !== undefined;
    }
}
