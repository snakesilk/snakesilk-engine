const THREE = require('three');

const AudioPlayer = require('./AudioPlayer');
const Keyboard = require('./Keyboard');
const Events = require('./Events');
const Player = require('./Player');
const Scene = require('./Scene');
const Timer = require('./Timer');

class Game
{
    constructor()
    {
        this.EVENT_SCENE_SET = 'scene_set';
        this.EVENT_SCENE_CREATE = 'scene_create';
        this.EVENT_SCENE_DESTROY = 'scene_destroy';
        this.EVENT_SCENE_UNSET = 'scene_unset';

        this.render = this.render.bind(this);
        this.updateTime = this.updateTime.bind(this);

        this._paused = null;
        this._playbackSpeed = 1;

        this.input = new Keyboard;
        this.events = new Events(this);
        this.audioPlayer = new AudioPlayer();

        this.timer = new Timer();
        this.timer.events.bind(this.timer.EVENT_RENDER, this.render);
        this.timer.events.bind(this.timer.EVENT_UPDATE, this.updateTime);

        this.renderer = new THREE.WebGLRenderer({
            'antialias': false,
        });

        this.player = new Player();

        this.element = null;
        this.scene = null;

        this.handleInputEvent = this.handleInputEvent.bind(this);
        this.pause();
    }
    destroy()
    {
        this.audioPlayer.destroy();
    }
    attachController(element)
    {
        element.addEventListener('keydown', this.handleInputEvent);
        element.addEventListener('keyup', this.handleInputEvent);
    }
    attachToElement(element)
    {
        this.element = element;
        this.adjustResolution();
        this.element.appendChild(this.renderer.domElement);
    }
    adjustAspectRatio()
    {
        if (this.scene && this.element) {
            const rect = this.element.getBoundingClientRect();
            const cam = this.scene.camera.camera;
            cam.aspect = rect.width / rect.height;
            cam.updateProjectionMatrix();
        }
    }
    adjustResolution()
    {
        const rect = this.element.getBoundingClientRect();
        this.setResolution(rect.width, rect.height);
    }
    handleInputEvent(event)
    {
        this.input.handleEvent(event);
    }
    pause()
    {
        if (this._paused === true) {
            return;
        }
        this._paused = true;
        this.audioPlayer.pause();
        this.input.disable();
        this.timer.pause();
        if (this.scene) {
            this.scene.events.trigger(this.scene.EVENT_PAUSE);
        }
    }
    resume()
    {
        if (this._paused === false) {
            return;
        }
        this._paused = false;
        this.audioPlayer.resume();
        this.input.enable();
        this.timer.run();
        if (this.scene) {
            this.scene.events.trigger(this.scene.EVENT_RESUME);
        }
    }
    render()
    {
        if (this.scene) {
            this.scene.render(this.renderer);
        }
    }
    setPlaybackSpeed(rate)
    {
        this._playbackSpeed = rate;
        this._updatePlaybackSpeed();
    }
    _updatePlaybackSpeed()
    {
        this.timer.setTimeStretch(this._playbackSpeed);
        this.audioPlayer.setPlaybackRate(this._playbackSpeed);
    }
    setResolution(w, h)
    {
        this.renderer.setSize(w, h);
        this.renderer.domElement.removeAttribute("style");
    }
    setScene(scene)
    {
        if (scene instanceof Scene === false) {
            throw new Error('Invalid scene');
        }

        this.unsetScene();

        this.scene = scene;
        this.input.release();

        this.scene.audio.events.bind(
            this.scene.audio.EVENT_PLAY,
            this.audioPlayer.play);

        this.scene.audio.events.bind(
            this.scene.audio.EVENT_STOP,
            this.audioPlayer.stop);

        this.scene.events.trigger(this.scene.EVENT_CREATE, [this]);
        this.events.trigger(this.EVENT_SCENE_CREATE, [this.scene]);
        this.events.trigger(this.EVENT_SCENE_SET, [this.scene]);

        this.input.events.bind(this.input.EVENT_TRIGGER, this.scene.receiveInput);

        /* Because the camera is instantiated per scene,
           we make sure the aspect ratio is correct before
           we roll. */
        this.adjustAspectRatio();

        this.scene.events.trigger(this.scene.EVENT_START);

        if (!this._paused) {
            this.scene.events.trigger(this.scene.EVENT_RESUME);
        }
    }
    updateTime(dt) {
        if (this.scene) {
            this.scene.updateTime(dt);
        }
    }
    unsetScene()
    {
        if (this.scene) {
            this.input.events.unbind(this.input.EVENT_TRIGGER, this.scene.receiveInput);

            this.events.trigger(this.EVENT_SCENE_UNSET, [this.scene]);
            this.events.trigger(this.EVENT_SCENE_DESTROY, [this.scene]);
            this.scene.events.trigger(this.scene.EVENT_DESTROY);

            this.scene.audio.events.unbind(
                this.scene.audio.EVENT_PLAY,
                this.audioPlayer.play);

            this.scene.audio.events.unbind(
                this.scene.audio.EVENT_STOP,
                this.audioPlayer.stop);

            this.scene = null;
        }
    }
}

module.exports = Game;
