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

    parseResourcesNode(resourcesNode) {
        const audioTask = resourcesNode.find('audio > *')
            .then(nodes => this.parseAudioNodes(nodes));

        const objectTask = resourcesNode.find('objects')
            .then(nodes => this.parseObjectsNodes(nodes));

        return Promise.all([
            audioTask,
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
