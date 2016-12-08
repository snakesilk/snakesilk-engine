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
        return Promise.all(audioNodes.map(node => {
            return this.parseAudioNode(node);
        }));
    }

    parseAudioNode(audioNode) {
        console.log(audioNode);
        const url = audioNode.attr('src').toURL();
        const id = audioNode.attr('id').value;

        return this.resourceLoader.loadAudio(url)
        .then(audio => {
            return audioNode.find('loop')
            .then(([loopNode]) => {
                if (loopNode) {
                    const start = loopNode.attr('start');
                    const end = loopNode.attr('end');
                    audio.setLoop(
                        start ? start.toFloat() : 0,
                        end ? end.toFloat() : audio.getBuffer().duration);
                }
                return audio;
            });
        })
        .then(audio => {
            this.resourceManager.addAudio(id, audio);
        });
    }

    parseResourcesNode(resourcesNode) {
        let groupsNodes;

        const pursueGroup = () => {
            chain = chain.then(() => {
                console.log(groupsNodes);
                if (groupsNodes.length) {
                    return this.parseResourcesGroupNode(groupsNodes.pop())
                    .then(pursueGroup);
                }
            });
        };

        let chain = resourcesNode.find('group')
        .then(nodes => {
            if (nodes.length) {
                nodes.sort((aNode, bNode) => {
                    const a = aNode.attr('order').toInt();
                    const b = bNode.attr('order').toInt();
                    return a < b;
                });
                groupsNodes = nodes;
            }
        })
        .then(pursueGroup);
        /*
        .then(objectNodes => this.parseObjectNodes(objectNodes))
        .then(() => resourceNode.find(`group[order='2'] > objects`))
        .then(objectNodes => this.parseObjectNodes(objectNodes))
        .then(() => resourceNode.find(`group[order='3'] > objects`))
        .then(objectNodes => this.parseObjectNodes(objectNodes));*/
    }

    parseResourcesGroupNode(groupNode) {
        const audioTask = groupNode.find('audio > *')
            .then(nodes => this.parseAudioNodes(nodes));

        const objectTask = groupNode.find('objects')
            .then(nodes => this.parseObjectsNodes(nodes));

        return Promise.all([
            objectTask,
            audioTask,
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
