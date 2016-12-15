Engine.InputReceiver = class InputReceiver
{
    constructor()
    {
        this._enabled = true;
        this._events = new Engine.Events();
    }
    enable()
    {
        this._enabled = true;
    }
    disable()
    {
        this._enabled = false;
    }
    listen(key, fn)
    {
        this._events.bind(key, fn);
    }
    receive(name, state)
    {
        if (!this._enabled) {
            return false;
        }

        this._events.trigger(name, [state]);

        return true;
    }
}
