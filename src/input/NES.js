Engine.Input.NES = (function() {
    class NES extends Engine.Input.Keyboard
    {
        constructor()
        {
            super();

            this.importMap({
                65: NES.LEFT,
                68: NES.RIGHT,
                87: NES.UP,
                83: NES.DOWN,
                80: NES.A,
                79: NES.B,
                81: NES.SELECT,
                69: NES.START,
            });
        }

        getDPADState() {
            const state = this._state;
            let x = 0, y = 0;

            if (state[NES.LEFT]) {
                --x;
            }
            if (state[NES.RIGHT]) {
                ++x;
            }
            if (state[NES.DOWN]) {
                --y;
            }
            if (state[NES.UP]) {
                ++y;
            }

            return {x, y};
        }

        trigger(key, state)
        {
            if (!super.trigger(key, state)) {
                return false;
            }

            if (DPAD.has(key)) {
                if (state === true) {
                    this.triggerDPADTap(key);
                }
                this.triggerDPADState();
            }

            return true;
        }

        triggerDPADTap(key) {
            let x = 0, y = 0;

            if (key === NES.LEFT) {
                x = -1;
            } else if (key === NES.RIGHT) {
                x = 1;
            } else if (key === NES.DOWN) {
                y = -1;
            } else if (key === NES.UP) {
                y = 1;
            }

            this.emit(NES.DPAD_TAP, {x, y});
        }

        triggerDPADState() {
            this.emit(NES.DPAD_STATE, this.getDPADState());
        }
    }

    NES.DPAD_TAP = 'DPAD_TAP';
    NES.DPAD_STATE = 'DPAD_STATE';

    NES.LEFT = 'LEFT';
    NES.RIGHT = 'RIGHT';
    NES.UP = 'UP';
    NES.DOWN = 'DOWN';
    NES.A = 'A';
    NES.B = 'B';
    NES.SELECT = 'SELECT';
    NES.START = 'START';

    const DPAD = new Set([
        NES.LEFT,
        NES.RIGHT,
        NES.UP,
        NES.DOWN,
    ]);

    const BUTTONS = new Set([
        NES.A,
        NES.B,
        NES.START,
        NES.SELECT,
    ]);

    return NES;
}());

