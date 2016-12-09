'use strict';

Engine.Loader.XML.ResourceParser =
class ResourceParser
{
    constructor(loader)
    {
        this.loader = loader;
        this.resourceLoader = loader.resourceLoader;
        this.resourceManager = loader.resourceManager;
    }

    parseAudioNodes(audioNodes) {
        const audioParser = new Engine.Loader.XML
            .AudioParser(this.loader);

        return Promise.all(audioNodes.map(audioNode => {
            const id = audioNode.attr('id').value;
            return audioParser.getAudio(audioNode)
                .then(audio => {
                    return {
                        id,
                        audio,
                    };
                });
        }))
        .then(audio => {
            audio.forEach(audio => {
                this.resourceManager.addAudio(audio.id, audio.audio);
            });
        });
    }

    parseFontNodes(fontNodes) {
        return Promise.all(fontNodes.map(fontNode => {
            const url = fontNode.attr('url').toURL();
            return this.resourceLoader.loadImage(url)
            .then(canvas => {
                const fontId = fontNode.attr('id').value;
                const size = {
                    x: fontNode.attr('w').toFloat(),
                    y: fontNode.attr('h').toFloat(),
                };
                const map = fontNode.node.getElementsByTagName('map')[0].textContent;
                const font = new Engine.BitmapFont(map, size, canvas);
                font.scale = this.loader.textureScale;
                this.resourceManager.addFont(fontId, text => {
                    return font.createText(text);
                });
            });
        }));
    }

    parseResourcesNode(resourcesNode) {
        const audioTask = resourcesNode.find('audio > *')
            .then(nodes => this.parseAudioNodes(nodes));

        const fontTask = resourcesNode.find('fonts > font')
            .then(nodes => this.parseFontNodes(nodes));

        const objectTask = resourcesNode.find('objects')
            .then(nodes => this.parseObjectsNodes(nodes));

        return Promise.all([
            audioTask,
            fontTask,
            objectTask,
        ]);
    }

    /**
      * Parses list of <objects/> and puts objects in ResourceManager.
      */
    parseObjectsNodes(objectsNodes) {
        return Promise.all(objectsNodes.map(objectsNode => {
            return this.parseObjectsNode(objectsNode);
        }));
    }

    /**
      * Parses <objects/> and puts objects in ResourceManager.
      */
    parseObjectsNode(objectsNode)
    {
        const objectParser = new Engine.Loader.XML
            .ObjectParser(this.loader, objectsNode.node);

        return objectParser.getObjects()
        .then(objects => {
            Object.keys(objects).forEach(id => {
                const object = objects[id];
                this.resourceManager
                    .addObject(id, object.constructor);
            });
        });
    }
}
