Engine.Game = class Game
{
    constructor()
    {
        this.EVENT_SCENE_SET = 'scene_set';
        this.EVENT_SCENE_CREATE = 'scene_create';
        this.EVENT_SCENE_DESTROY = 'scene_destroy';
        this.EVENT_SCENE_UNSET = 'scene_unset';

        this._paused = null;
        this._playbackSpeed = 1;

        this.audioPlayer = new Engine.AudioPlayer();
        this.events = new Engine.Events(this);

        this.renderer = new THREE.WebGLRenderer({
            'antialias': false,
        });

        this.element = null;
        this.scene = null;
        this.timer = new Engine.Timer();

        this.pause();

        this.updateScene = this.updateScene.bind(this);
        this.renderScene = this.renderScene.bind(this);
    }

    destroy()
    {
        this.audioPlayer.destroy();
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
    pause()
    {
        if (this._paused === true) {
            return;
        }
        this._paused = true;
        this.audioPlayer.pause();
        this.timer.pause();
    }
    resume()
    {
        if (this._paused === false) {
            return;
        }
        this._paused = false;
        this.audioPlayer.resume();
        this.timer.run();
    }
    render()
    {
        this.scene.render();
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
        this.renderer.domElement.removeAttribute('style');
    }

    renderScene()
    {
        this.scene.render(this.renderer);
    }

    setScene(scene)
    {
        if (scene instanceof Engine.Scene === false) {
            throw new Error('Invalid scene');
        }

        this.unsetScene();

        const timer = this.timer;
        timer.events.bind(timer.EVENT_UPDATE, this.updateScene);
        timer.events.bind(timer.EVENT_RENDER, this.renderScene);

        this.scene = scene;
        this.scene.events.trigger(this.scene.EVENT_CREATE, [this]);
        this.events.trigger(this.EVENT_SCENE_CREATE, [this.scene]);
        this.events.trigger(this.EVENT_SCENE_SET, [this.scene]);

        /* Because the camera is instantiated per scene,
           we make sure the aspect ratio is correct before
           we roll. */
        this.adjustAspectRatio();

        this.scene.events.trigger(this.scene.EVENT_START);
    }

    unsetScene()
    {
        if (this.scene) {
            this.scene.events.trigger(this.scene.EVENT_END);

            const timer = this.timer;
            timer.events.unbind(timer.EVENT_UPDATE, this.updateScene);
            timer.events.unbind(timer.EVENT_RENDER, this.renderScene);

            this.events.trigger(this.EVENT_SCENE_DESTROY, [this.scene]);
            this.scene.events.trigger(this.scene.EVENT_DESTROY, [this]);
            this.scene = null;
        }
    }

    updateScene(dt)
    {
        this.scene.updateTime(dt);
    }
}
