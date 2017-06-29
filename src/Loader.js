const Registry = require('./Registry');
const ResourceLoader = require('./ResourceLoader');
const ResourceManager = require('./ResourceManager');
const Traits = require('./traits');

class Loader
{
    constructor(game)
    {
        this.game = game;

        this.resourceManager = new ResourceManager(this);
        this.resourceLoader = new ResourceLoader(this);

        this.entities = new Registry();
        this.entities.add(Traits);

        this.textureScale = 1;
    }
}

module.exports = Loader;
