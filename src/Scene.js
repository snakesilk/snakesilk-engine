const AudioManager = require('./AudioManager');
const Camera = require('./Camera');
const Events = require('./Events');
const Keyboard = require('./Keyboard');
const Loops = require('./Loops');
const SequenceManager = require('./SequenceManager');
const World = require('./World');

class Scene
{
    constructor()
    {
        this.EVENT_CREATE = 'create';
        this.EVENT_DESTROY = 'destroy';
        this.EVENT_END = 'end';
        this.EVENT_START = 'start';
        this.EVENT_PAUSE = 'pause';
        this.EVENT_RESUME = 'resume';

        this.EVENT_UPDATE_TIME = 'update-time';
        this.EVENT_INPUT = 'input';

        this.audio = new AudioManager();
        this.sequencer = new SequenceManager(this);
        this.camera = new Camera;
        this.events = new Events(this);
        this.input = new Keyboard;
        this.world = new World;

        this.doFor = Loops.doFor(
            this.world.events,
            this.world.EVENT_SIMULATE);

        this.waitFor = Loops.waitFor(
            this.world.events,
            this.world.EVENT_SIMULATE);

        const audioListener = (audio) => {
            this.audio.playAudio(audio);
        };

        this.events.bind(this.EVENT_CREATE, () => {
            this.world.events.bind(
                this.world.EVENT_EMIT_AUDIO,
                audioListener);
        });

        this.events.bind(this.EVENT_PAUSE, () => {
            this.input.release();
        });

        this.events.bind(this.EVENT_END, () => {
            this.input.release();
        });

        this.events.bind(this.EVENT_DESTROY, () => {
            this.audio.stopAll();
            this.world.events.unbind(
                this.world.EVENT_EMIT_AUDIO,
                audioListener);
        });

        this.receiveInput = this.receiveInput.bind(this);
    }
    receiveInput(key, state) {
        /* Send input to active input handler. */
        this.input.trigger(key, state);

        /* Notify listeners. */
        this.events.trigger(this.EVENT_INPUT, [key, state]);
    }
    render(renderer) {
        renderer.render(this.world.scene, this.camera.camera);
    }
    pauseSimulation() {
        this._paused = true;
    }
    resumeSimulation() {
        this._paused = false;
    }
    updateTime(dt) {
        if (this._paused) {
            return;
        }
        this.world.updateTime(dt);
        this.camera.updateTime(dt);
        this.events.trigger(this.EVENT_UPDATE_TIME, [dt]);
    }
}

module.exports = Scene;
