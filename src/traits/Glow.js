const Light = require('./Light');

class Glow extends Light
{
    constructor()
    {
        super();
        this.NAME = 'glow';
    }
    __attach(host)
    {
        super.__attach(host);
        const model = this._host.model;
        this.lamps.forEach(lamp => {
            model.add(lamp.light);
        });
    }
    __detach()
    {
        const model = this._host.model;
        this.lamps.forEach(lamp => {
            model.remove(lamp.light);
        });
        super.__detach();
    }
}

module.exports = Glow;
