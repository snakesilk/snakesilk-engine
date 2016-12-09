Engine.Loader.XML.AudioParser =
class AudioParser
{
    constructor(loader)
    {
        this.resourceLoader = loader.resourceLoader;
        this.resourceManager = loader.resourceManager;
    }

    getAudio(audioNode)
    {
        const id = audioNode.attr('id').value;
        return audioNode.attr('url')
            ? this.loadAudio(audioNode)
            : this.resourceManager.getAsync('audio', id);
    }

    loadAudio(audioNode) {
        const url = audioNode.attr('url').toURL();
        return Promise.all([
            this.resourceLoader.loadAudio(url),
            audioNode.find('loop'),
        ]).then(([audio, [loopNode]]) => {
            if (loopNode) {
                const start = loopNode.attr('start');
                const end = loopNode.attr('end');
                audio.setLoop(
                    start ? start.toFloat() : 0,
                    end ? end.toFloat() : audio.getBuffer().duration);
            }
            return audio;
        });
    }
}
