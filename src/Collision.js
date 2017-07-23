const {Vector2} = require('three');
const BoundingBox = require('./BoundingBox');
const Entity = require('./Entity');
const {rectanglesIntersect} = require('./Math');

function zonesCollide(zone1, zone2) {
    return rectanglesIntersect(
        zone1.x, zone1.y, zone1.w, zone1.h,
        zone2.x, zone2.y, zone2.w, zone2.h);
}

class Entry {
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
        this.collisionIndex = [];

        this.garbage = [];

        this.collisionMaxDistanceSq = undefined;
    }

    addObject(object) {
        if (object instanceof Entity !== true) {
            throw new TypeError('Collidable wrong type');
        }
        this.objects.push(new Entry(object));
        this.collisionIndex.push([]);
    }

    garbageCollect() {
        let object;
        let index;
        while (object = this.garbage.pop()) {
            while ((index = this.objects.findIndex(entry => entry.entity === object)) !== -1) {
                this.objects.splice(index, 1);
                this.collisionIndex.splice(index, 1);
           }
        }
    }

    removeObject(object) {
        this.garbage.push(object);
    }

    detect() {
        this.garbageCollect();

        for (let i = 0, l = this.objects.length; i !== l; ++i) {
            if (this.objects[i].needsCheck()) {
                for (let j = 0; j !== l; ++j) {
                    if (i !== j && this.objects[j].entity.collidable) {
                        this.objectIndexesCollide(i, j);
                    }
                }
            }
        }

        for (let i = 0, l = this.objects.length; i !== l; ++i) {
            this.objects[i].updateLastPos();
        }
    }

    objectIndexesCollide(i, j) {
        const o1 = this.objects[i].entity;
        const o2 = this.objects[j].entity;

        if (this.objectsCollide(o1, o2)) {
            if (this.collisionIndex[i].indexOf(o2) < 0) {
                this.collisionIndex[i].push(o2);
            }
            return true;
        }
        else {
            const ix = this.collisionIndex[i].indexOf(o2);
            if (ix !== -1) {
                o1.uncollides(o2);
                o2.uncollides(o1);
                this.collisionIndex[i].splice(ix, 1);
            }
            return false;
        }
    }

    objectsCollide(o1, o2) {
        if (o1.position.distanceToSquared(o2.position) > this.collisionMaxDistanceSq) {
            return false;
        }

        for (let i = 0, l = o1.collision.length; i !== l; ++i) {
            const z1 = o1.collision[i];
            for (let j = 0, m = o2.collision.length; j !== m; ++j) {
                const z2 = o2.collision[j];
                if (this.zonesCollide(o1, z1, o2, z2)) {
                    o1.collides(o2, z1, z2);
                    o2.collides(o1, z2, z1);
                    return true;
                }
            }
        }
        return false;
    }

    setCollisionRadius(units) {
        this.collisionMaxDistanceSq = units * units;
    }

    zonesCollide(object1, zone1, object2, zone2) {
        return rectanglesIntersect(
            zone1.x, zone1.y, zone1.w, zone1.h,
            zone2.x, zone2.y, zone2.w, zone2.h);
    }
}

module.exports = Collision;
