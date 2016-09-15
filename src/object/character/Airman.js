Engine.objects.characters.Airman = function()
{
    Engine.Entity.call(this);
    this.isBlowing = false;
}

Engine.Util.extend(Engine.objects.characters.Airman,
                   Engine.Entity);

Engine.objects.characters.Airman.prototype.routeAnimation = function()
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
