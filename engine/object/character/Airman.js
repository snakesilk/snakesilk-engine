const Entity = require('../../Object');

class Airman extends Entity
{
    constructor() {
        super();
        this.isBlowing = false;
    }

    routeAnimation()
    {
        if (this.weapon._firing) {
            return 'fire';
        }

        if (!this.jump._ready) {
            return 'jump';
        }

        if (this.isBlowing) {
            return 'blow';
        }

        return 'idle';
    }
}

module.exports = Airman;
