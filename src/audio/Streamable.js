const Events = require('./Events');
const {readOnly} = require('./Util');

class Audio
{
    constructor()
    {
        console.log(buffer);
        readOnly(this, {
            buffer:
            events: new Events(this),
        });

        this._buffer = buffer;
        this._loop = null;
    }
    append(buffer) {

    }
    getLoop()
    {
        return this._loop;
    }
    play(context) {
        const source = context.createBufferSource();
        source.connect(context.destination);
        source.buffer = audio.getBuffer();
        source.playbackRate.value = this._playbackRate;
        source.addEventListener('ended', () => {
            this._playing.delete(audio);
        });
        const loop = audio.getLoop();
        if (loop) {
            source.loopStart = loop[0];
            source.loopEnd = loop[1];
            source.loop = true;
        }
        source.start(0);
    }
    setLoop(start, end)
    {
        this._loop = [start, end];
    }
}

module.exports = Audio;
