const {Mesh, Object3D, Vector2, Vector3, Math: {generateUUID}} = require('three');
const BoundingBox = require('./BoundingBox');
const Events = require('./Events');
const {doFor, waitFor} = require('./Loops');
const SequenceManager = require('./SequenceManager');
const Verlet = require('./Verlet');
const {readOnly} = require('./Util');

const ANIM = Symbol('Current Animation');

class Entity
{
    constructor() {
        this.id = undefined;
        this.name = undefined;

        this[ANIM] = undefined;

        this.collidable = true;
        this.emitter = undefined;
        this.origo = new Vector2();
        this.position = new Vector3();
        this.time = 0;
        this.timeStretch = 1;
        this.world = undefined;

        const events = new Events(this);

        readOnly(this, {
            aim: new Vector2(),
            animations: new Map(),
            animators: [],
            audio: {},
            collision: [],
            direction: new Vector2(this.DIRECTION_RIGHT, 0),
            doFor: doFor(events, this.EVENT_TIMESHIFT),
            events: events,
            integrator: new Verlet(new Vector2()),
            sequencer: new SequenceManager(this),
            textures: new Map(),
            traits: [],
            uuid: generateUUID(),
            velocity: new Vector2(),
            waitFor: waitFor(events, this.EVENT_TIMESHIFT),
        });

        this.setModel(new Object3D());
    }

    addCollisionRect(w, h, offsetX = 0, offsetY = 0) {
        const boundingBox = new BoundingBox(
            this.position,
            {
                x: w,
                y: h,
            },
            {
                x: offsetX,
                y: offsetY,
            }
        );
        this.collision.push(boundingBox);
    }

    addCollisionZone(r, offsetX, offsetY) {
        return this.addCollisionRect(r * 2, r * 2, offsetX, offsetY);
    }

    applyTrait(trait) {
        if (trait.NAME in this) {
            throw new Error(`Trait name "${trait.NAME}" occupied.`);
        }

        trait.__attach(this);
        this.traits.push(trait);

        readOnly(this, {
            [trait.NAME]: trait,
        });

        this.events.trigger(this.EVENT_TRAIT_ATTACHED, [trait]);
    }

    collides(withObject, ourZone, theirZone) {
        this.events.trigger(this.EVENT_COLLIDE, [withObject, ourZone, theirZone]);
    }

    emitAudio(audio) {
        if (this.world) {
            this.world.emitAudio(audio);
        }
    }

    getTrait(traitReference) {
        return this.traits.find(t => t instanceof traitReference) || false;
    }

    moveTo(vec) {
        Object.keys(this.position).forEach(k => {
            const v = vec[k];
            if (typeof v === 'number' && isFinite(v)) {
                this.position[k] = v;
            }
        });
    }

    obstruct(object, attack, ourZone, theirZone) {
        this.events.trigger(this.EVENT_OBSTRUCT, [object, attack, ourZone, theirZone]);
    }

    reset() {
        this.aim.set(0, 0);
        this.traits.forEach(trait => {
            if (typeof trait.reset === 'function') {
                trait.reset();
            }
        });
    }

    removeFromWorld() {
        if (this.world) {
            this.world.removeObject(this);
        }
    }

    routeAnimation() {
        return null;
    }

    setAnimation(name) {
        if (name !== this[ANIM]) {
            this.animators[0].setAnimation(this.animations.get(name));
            this[ANIM] = name;
        }
    }

    setEmitter(entity) {
        if (entity instanceof Entity !== true) {
            throw new Error('Invalid emitter');
        }
        this.emitter = entity;
    }

    setModel(model) {
        this.model = model;
        this.position = this.model.position;
    }

    setWorld(world) {
        this.world = world;
        this.events.trigger(this.EVENT_WORLD_ADD);
    }

    timeShift(deltaTime) {
        const adjustedDelta = deltaTime * this.timeStretch;

        const anim = this.routeAnimation();
        if (anim) {
            this.setAnimation(anim);
        }

        if (this.aim.x !== 0) {
            this.direction.x = this.aim.x > 0 ? 1 : -1;
        }
        if (this.aim.y === 0) {
            this.direction.y = 0;
        } else {
            this.direction.y = this.aim.y > 0 ? 1 : -1;
        }

        if (this.model !== undefined && this.direction.x !== 0) {
            this.model.rotation.y = this.direction.x === 1 ? 0 : Math.PI;
        }

        this.events.trigger(this.EVENT_TIMESHIFT, [adjustedDelta, this.time]);
        this.integrator.integrate(this.position, this.velocity, adjustedDelta);

        this.time += adjustedDelta;
    }

    updateAnimators(deltaTime) {
        const adjustedDelta = deltaTime * this.timeStretch;
        this.animators.forEach(animator => {
            animator.update(adjustedDelta);
        });
    }

    uncollides(withObject) {
        this.events.trigger(this.EVENT_UNCOLLIDE, [withObject]);
    }

    unsetWorld() {
        this.events.trigger(this.EVENT_WORLD_REMOVE);
        this.world = undefined;
    }

    useTexture(textureId) {
        if (!this.textures.has(textureId)) {
            console.error(`Texture "${textureId}" not defined.`);
            return;
        }

        this.model.material.map = this.textures.get(textureId).texture;
        this.model.material.needsUpdate = true;
    }
}

Entity.prototype.DIRECTION_UP = 1;
Entity.prototype.DIRECTION_DOWN = -1;
Entity.prototype.DIRECTION_LEFT = -1;
Entity.prototype.DIRECTION_RIGHT = 1;

Entity.prototype.EVENT_WORLD_ADD = 'world-add';
Entity.prototype.EVENT_WORLD_REMOVE = 'world-remove';

Entity.prototype.EVENT_COLLIDE = 'collide';
Entity.prototype.EVENT_OBSTRUCT = 'obstruct';
Entity.prototype.EVENT_TIMESHIFT = 'timeshift';
Entity.prototype.EVENT_UNCOLLIDE = 'uncollide';

Entity.prototype.EVENT_TRAIT_ATTACHED = 'trait-attached';

Entity.prototype.SURFACE_TOP = 0;
Entity.prototype.SURFACE_BOTTOM = 1;
Entity.prototype.SURFACE_LEFT = 2;
Entity.prototype.SURFACE_RIGHT = 3;

module.exports = Entity;
