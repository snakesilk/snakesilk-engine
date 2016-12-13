Engine.Input.Keyboard = class Keyboard
{
    constructor()
    {
        this.EVENT_TRIGGER = 'trigger';

        this.events = new Engine.Events(this);

        this._map = Object.create(null);
        this._state = Object.create(null);
    }
    assign(key, name)
    {
        this._map[key] = name;
    }
    exportMap()
    {
        return this._map;
    }
    importMap(map)
    {
        this._map = Object.create(null);
        Object.keys(map).forEach(code => {
            this.assign(code, map[code]);
        });
    }
    handleEvent(event)
    {
        const key = event.keyCode;
        if (this._map[key]) {
            if (event.preventDefault) {
                event.preventDefault();
            }
            this.trigger(this._map[key], event.type);
        }
    }
    release()
    {
        Object.keys(this._map).forEach(key => {
            this.trigger(this._map[key], this.RELEASE);
        });
    }
    trigger(key, state)
    {
        if (this._state[key] === state) {
            return false;
        }

        this._state[key] = state;

        this.events.trigger(this.EVENT_TRIGGER, [key, state]);

        return true;
    }
    unassign(key)
    {
        delete this._map[key];
    }
}
