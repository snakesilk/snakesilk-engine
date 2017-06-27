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

        this.doFor = Loops.doFor(this.world.events, this.world.EVENT_SIMULATE);
        this.waitFor = Loops.waitFor(this.world.events, this.world.EVENT_SIMULATE);

        this.input.events.bind(this.input.EVENT_TRIGGER, (key, type) => {
            this.events.trigger(this.EVENT_INPUT, [key, type]);
        });

        this._inputRoute = (key, state) => {
            this.input.trigger(key, state);
        };

        const audioListener = (audio) => {
            this.game.audioPlayer.play(audio);
        };

        this.events.bind(this.EVENT_CREATE, (game) => {
            this.__create(game);
            this.world.events.bind(this.world.EVENT_EMIT_AUDIO, audioListener);
        });

        this.events.bind(this.EVENT_RESUME, () => {
            this.__resume();
        });

        this.events.bind(this.EVENT_PAUSE, () => {
            this.__pause();
        });

        this.events.bind(this.EVENT_END, () => {
            this.__end();
        });

        this.events.bind(this.EVENT_DESTROY, () => {
            this.__destroy();
            this.world.events.unbind(this.world.EVENT_EMIT_AUDIO, audioListener);
        });
    }
    __create(game)
    {
        this.game = game;
        this.audio.setPlayer(this.game.audioPlayer);

        const input = this.game.input;
        input.events.bind(input.EVENT_TRIGGER, this._inputRoute);
    }
    __start()
    {
    }
    __resume()
    {
    }
    __pause()
    {
        this.input.release();
    }
    __end()
    {
        this.__pause();
    }
    __destroy()
    {
        this.audio.stopAll();
        this.audio.unsetPlayer();

        const input = this.game.input;
        input.events.unbind(input.EVENT_TRIGGER, this._inputRoute);
        this.game = null;
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
