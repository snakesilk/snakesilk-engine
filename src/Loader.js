const Registry = require('./Registry');
const ResourceLoader = require('./ResourceLoader');
const ResourceManager = require('./ResourceManager');

class Loader
{
    constructor(game)
    {
        this.game = game;

        this.resourceManager = new ResourceManager(this);
        this.resourceLoader = new ResourceLoader(this);

        this.entities = new Registry();
        this.traits = new Registry();

        this.textureScale = 1;
    }
}

module.exports = Loader;
