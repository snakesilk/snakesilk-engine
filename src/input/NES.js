'use strict';

Engine.Input.NES =
class NESInput extends Engine.Input.Keyboard
{
    constructor()
    {
        super();

        this.EVENT_DPAD = 'DPAD';
        this.EVENT_BUTTON = 'BUTTON';

        this.LEFT = 'LEFT';
        this.RIGHT = 'RIGHT';
        this.UP = 'UP';
        this.DOWN = 'DOWN';
        this.A = 'A';
        this.B = 'B';
        this.SELECT = 'SELECT';
        this.START = 'START';

        this.DPAD = new Set([
            this.LEFT,
            this.RIGHT,
            this.UP,
            this.DOWN,
        ]);

        this.BUTTONS = new Set([
            this.A,
            this.B,
            this.START,
            this.SELECT,
        ]);

        this._direction = new THREE.Vector2();

        this.importMap({
            65: this.LEFT,
            68: this.RIGHT,
            87: this.UP,
            83: this.DOWN,
            80: this.A,
            79: this.B,
            81: this.SELECT,
            69: this.START,
        });
    }
    getDirection() {
        const state = this._state;
        return this._direction.set(
            (state[this.LEFT] ? -1 : 0) + (state[this.RIGHT] ? 1 : 0),
            (state[this.DOWN] ? -1 : 0) + (state[this.UP] ? 1 : 0));
    }
    trigger(key, state)
    {
        if (!super.trigger(key, state)) {
            return false;
        }

        if (this.DPAD.has(key)) {
            const dir = this.getDirection();
            this.events.trigger(this.EVENT_DPAD,
                                [dir, state]);
        } else if (this.BUTTONS.has(key)) {
            this.events.trigger(this.EVENT_BUTTON,
                                [key, state]);
        }

        return true;
    }
}
