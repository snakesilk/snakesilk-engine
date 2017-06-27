const Events = require('./Events');

class AudioManager
{
    constructor()
    {
        this.EVENT_PLAY = 'audio-play';
        this.EVENT_STOP = 'audio-stop';

        this.events = new Events(this);
        this._audio = new Map;
    }
    add(id, audio)
    {
        this._audio.set(id, audio);
    }
    _get(id)
    {
        const audio = this._audio.get(id);
        if (!audio) {
            throw new Error(`Audio id '${id}' not defined`);
        }
        return audio;
    }
    play(id)
    {
        const audio = this._get(id);
        this.playAudio(audio);
    }
    playAudio(audio)
    {
        this.events.trigger(this.EVENT_PLAY, [audio]);
    }
    stop(id)
    {
        const audio = this._get(id);
        this.stopAudio(audio);
    }
    stopAudio(audio)
    {
        this.events.trigger(this.EVENT_STOP, [audio]);
    }
    stopAll()
    {
        this._audio.forEach(audio => {
            this.stopAudio(audio);
        });
    }
}

module.exports = AudioManager;
