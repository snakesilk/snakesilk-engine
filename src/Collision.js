const {Vector2} = require('three');
const BoundingBox = require('./BoundingBox');
const Entity = require('./Entity');
const {rectanglesIntersect} = require('./Math');

function zonesCollide(zone1, zone2) {
    return rectanglesIntersect(
        zone1.x, zone1.y, zone1.w, zone1.h,
        zone2.x, zone2.y, zone2.w, zone2.h);
}

class Entry 
{
    constructor(entity) {
        this.entity = entity;
        this.collidingWith = new Set();
        this.lastPosition = new Vector2().set(NaN, NaN, NaN);
    }

    check(entry) {
        const us = this.entity;
        const them = entry.entity;

        const ours = us.collision;
        const theirs = them.collision;

        for (let i = 0, l = ours.length; i !== l; ++i) {
            const z1 = ours[i];
            for (let j = 0, m = theirs.length; j !== m; ++j) {
                const z2 = theirs[j];
                if (zonesCollide(z1, z2)) {
                    us.collides(them, z1, z2);
                    them.collides(us, z2, z1);
                    this.collidingWith.add(entry);
                    return true;
                }
            }
        }

        if (this.collidingWith.has(entry)) {
            us.uncollides(them);
            them.uncollides(us);
            this.collidingWith.delete(entry);
        }
        return false;
    }

    needsCheck() {
        return this.entity.collidable 
            && !this.lastPosition.equals(this.entity.position);
    }

    updateLastPos() {
        this.lastPosition.copy(this.entity.position);
    }
}

class Collision
{
    constructor() {
        this.objects = [];
        this.garbage = [];
        this.collisionMaxDistanceSq = undefined;
    }

    addObject(object) {
        if (object instanceof Entity !== true) {
            throw new TypeError('Collidable wrong type');
        }
        this.objects.push(new Entry(object));
    }

    removeObject(object) {
        this.garbage.push(object);
    }

    detect() {
        this.garbageCollect();

        this.objects.forEach(entry1 => {
            if (entry1.needsCheck()) {
                this.objects.forEach(entry2 => {
                    if (entry1 !== entry2 && entry2.entity.collidable) {
                        this.objectsCollide(entry1, entry2);
                    }
                });
            }
        });

        this.objects.forEach(entry => entry.updateLastPos());
    }

    garbageCollect() {
        let object;
        let index;
        while (object = this.garbage.pop()) {
            while ((index = this.objects.findIndex(entry => entry.entity === object)) !== -1) {
                this.objects.splice(index, 1);
           }
        }
    }

    objectsCollide(entry1, entry2) {
        if (entry1.entity.position.distanceToSquared(
            entry2.entity.position) > this.collisionMaxDistanceSq) {
            return false;
        }

        return entry1.check(entry2);
    }

    setCollisionRadius(units) {
        this.collisionMaxDistanceSq = units * units;
    }
}

module.exports = Collision;
