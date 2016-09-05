Engine.traits.Attach =
class Attach extends Engine.Trait
{
    constructor()
    {
        super();

        this.NAME = 'attach';

        this.EVENT_ATTACH = 'attach';

        this._offset = new THREE.Vector3;
        this._position = null;
    }
    __collides(withObject, ourZone, theirZone)
    {
        if (withObject.solid) {
            const host = this._host;
            const solid = withObject.solid;
            const dir = solid.attackDirection(ourZone, theirZone);

            /* If we are pushing from the top or below, just nudge. */
            if (dir === solid.TOP) {
                ourZone.top = theirZone.bottom;
            } else if (dir === solid.BOTTOM) {
                ourZone.bottom = theirZone.top;
            }
            /* If we hit something from left or right, we attach. */
            else {
                if (dir === solid.LEFT) {
                    ourZone.left = theirZone.right;
                } else if (dir === solid.RIGHT) {
                    ourZone.right = theirZone.left;
                }

                host.velocity.multiplyScalar(0);
                this._position = withObject.position;
                this._offset.copy(host.position).sub(this._position);

                /* Prefer attach timer to lifetime timer. */
                host.collidable = false;

                this._trigger(this.EVENT_ATTACH, [withObject]);
            }
        }
    }
    __timeshift(dt)
    {
        if (this._position !== null) {
            this._host.position.copy(this._position).add(this._offset);
        }
    }
    reset()
    {
        this._position = null;
        this._host.collidable = true;
    }
}
