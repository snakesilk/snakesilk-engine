const Events = require('./Events');

class ResourceManager
{
    constructor() {
        this.EVENT_RESOURCE_ADDED = 'resource-added';

        this.awaiting = new Map();
        this.events = new Events();
        this.items = new Map();
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

        if (!this.items.has(type)) {
            this.items.set(type, new Map());
        }

        this.items.get(type).set(id, object);

        this.events.trigger(this.EVENT_RESOURCE_ADDED, [{
            type,
            id,
            object,
        }]);
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
        if (this.has(type, id)) {
            const object = this.items.get(type).get(id);
            return Promise.resolve(object);
        }

        return new Promise((resolve, reject) => {
            const onEventAdded = (event) => {
                if (event.type === type && event.id === id) {
                    this.awaiting.delete(onEventAdded);
                    this.events.unbind(this.EVENT_RESOURCE_ADDED, onEventAdded);
                    resolve(event.object);
                }
            }

            this.awaiting.set(onEventAdded, {type, id});
            this.events.bind(this.EVENT_RESOURCE_ADDED, onEventAdded);
        });
    }

    has(type, id) {
        const sub = this.items.get(type);
        return sub ? sub.has(id) : false;
    }
}

module.exports = ResourceManager;
