Engine.traits.DeathZone =
class DeathZone extends Engine.Trait
{
    constructor()
    {
        super();
        this.NAME = 'deathZone';
    }
    __collides(withObject)
    {
        if (withObject.health && withObject.health.energy.depleted === false) {
            withObject.health.kill();
        }
    }
}
