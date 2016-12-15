Engine.Input.Keyboard =
class Keyboard
{
    constructor()
    {
        this.EVENT_EMIT = 'emit';

        this.TYPE_KEYDOWN = 'keydown';
        this.TYPE_KEYUP = 'keyup';

        this.events = new Engine.Events(this);

        this._map = Object.create(null);
        this._state = Object.create(null);

        this.handleEvent = this.handleEvent.bind(this);
    }
    assign(key, name)
    {
        this._map[key] = name;
    }
    emit(name, state) {
        this.events.trigger(this.EVENT_EMIT, [name, state]);
    }
    listen(fn) {
        this.events.bind(this.EVENT_EMIT, fn);
    }
    listenTo(element) {
        element.addEventListener(this.TYPE_KEYDOWN, this.handleEvent);
        element.addEventListener(this.TYPE_KEYUP, this.handleEvent);
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
            this.trigger(this._map[key], event.type === this.TYPE_KEYDOWN);
        }
    }
    release()
    {
        Object.keys(this._map).forEach(key => {
            this.trigger(this._map[key], false);
        });
    }
    trigger(key, state)
    {
        if (this._state[key] === state) {
            return false;
        }

        this._state[key] = state;

        this.emit(key, state);

        return true;
    }
    unassign(key)
    {
        delete this._map[key];
    }
}
