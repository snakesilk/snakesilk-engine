Engine.Scene =
class Scene
{
    constructor()
    {
        this.EVENT_CREATE = 'create';
        this.EVENT_DESTROY = 'destroy';
        this.EVENT_START = 'start';
        this.EVENT_END = 'end';

        this.audio = new Engine.AudioManager();
        this.sequencer = new Engine.SequenceManager(this);
        this.camera = new Engine.Camera;
        this.events = new Engine.Events(this);
        this.resources = new Engine.ResourceManager();
        this.world = new Engine.World;

        this.doFor = Engine.Loops.doFor(
            this.world.events, this.world.EVENT_SIMULATE);

        this.waitFor = Engine.Loops.waitFor(
            this.world.events, this.world.EVENT_SIMULATE);


        let audioProxy;
        this.events.bind(this.EVENT_CREATE, (game) => {
            audioProxy = (audio) => game.audioPlayer.play(audio);
            this.audio.setPlayer(game.audioPlayer);
            this.world.events.bind(this.world.EVENT_EMIT_AUDIO, audioProxy);
        });

        this.events.bind(this.EVENT_DESTROY, (game) => {
            this.audio.stopAll();
            this.audio.unsetPlayer();
            this.world.events.unbind(this.world.EVENT_EMIT_AUDIO, audioProxy);
        });

        this._paused = false;
    }

    pauseSimulation() {
        this._paused = true;
    }

    resumeSimulation() {
        this._paused = false;
    }

    render(renderer) {
        renderer.render(this.world.scene,
                        this.camera.camera);
    }

    updateTime(deltaTime) {
        if (this._paused === true) {
            return;
        }
        this.camera.updateTime(deltaTime);
        this.world.updateTime(deltaTime);
    }
}
