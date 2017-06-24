let Engine;


Engine = {
    logic: {},
};

'use strict';

Engine.Audio =
class Audio
{
    constructor(buffer)
    {
        this._buffer = buffer;
        this._loop = null;
    }
    getBuffer()
    {
        return this._buffer;
    }
    getLoop()
    {
        return this._loop;
    }
    setLoop(start, end)
    {
        this._loop = [start, end];
    }
}

'use strict';

Engine.AudioManager =
class AudioManager
{
    constructor()
    {
        this._audio = new Map;
        this._player = null;
    }
    add(id, audio)
    {
        this._audio.set(id, audio);
    }
    _get(id)
    {
        const audio = this._audio.get(id);
        if (!audio) {
            throw new Error(`Audio id '${id}' not defined`);
        }
        return audio;
    }
    play(id)
    {
        const audio = this._get(id);
        this._player.play(audio);
    }
    stop(id)
    {
        const audio = this._get(id);
        this._player.stop(audio);
    }
    stopAll()
    {
        this._audio.forEach(audio => {
            this._player.stop(audio);
        });
    }
    setPlayer(player)
    {
        this._player = player;
    }
    unsetPlayer()
    {
        this._player = null;
    }
}

'use strict';

Engine.AudioPlayer =
class AudioPlayer
{
    constructor()
    {
        this._context = new AudioContext();
        this._playing = new Map();
        this._playbackRate = 1;
    }
    destroy()
    {
        this._context.close();
    }
    getContext()
    {
        return this._context;
    }
    play(audio)
    {
        this.stop(audio);

        const source = this._context.createBufferSource();
        source.connect(this._context.destination);
        source.buffer = audio.getBuffer();
        source.playbackRate.value = this._playbackRate;
        source.addEventListener('ended', () => {
            this._playing.delete(audio);
        });
        const loop = audio.getLoop();
        if (loop) {
            source.loopStart = loop[0];
            source.loopEnd = loop[1];
            source.loop = true;
        }
        source.start(0);
        this._playing.set(audio, source);
    }
    pause()
    {
        this._context.suspend();
    }
    resume()
    {
        this._context.resume();
    }
    setPlaybackRate(rate)
    {
        this._playbackRate = rate;
        this._playing.forEach(source => {
            source.playbackRate.value = rate;
        });
    }
    stop(audio)
    {
        if (audio) {
            if (this._playing.has(audio)) {
                const current = this._playing.get(audio);
                current.stop();
            }
        } else {
            this._playing.forEach(source => {
                source.stop();
            });
            this._playing.clear();
        }
    }
}

Engine.Util = {
    renameFunction: function (name, fn) {
        return (new Function("return function (call) { return function " + name +
            " () { return call(this, arguments) }; };")())(Function.apply.bind(fn));
    },

    extend: function(child, parent, props)
    {
        child.prototype = Object.create(parent.prototype);
        child.prototype.constructor = child;

        if (props) {
            Object.keys(props).forEach(function(key) {
                child.prototype[key] = props[key];
            });
        }
    },

    string: {
        fill: function(x, n)
        {
            var s = '';
            for (;;) {
                if (n & 1) s += x;
                n >>= 1;
                if (n) x += x;
                else break;
            }
            return s;
        },
    },
}

'use strict';

Engine.Easing = {
    linear: () => {
        return t => t;
    },
    easeIn: (p) => {
        return t => Math.pow(t, p)
    },
    easeInQuad: () => {
        return t => t*t
    },
    easeOutQuad: () => {
        return t => t*(2-t)
    },
    easeInOutQuad: () => {
        return t => t<.5 ? 2*t*t : -1+(4-2*t)*t
    },
    easeInCubic: () => {
        return t => t*t*t
    },
    easeOutCubic: () => {
        return t => (--t)*t*t+1
    },
    easeInOutCubic: () => {
        return t => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1
    },
    easeInQuart: () => {
        return t => t*t*t*t
    },
    easeOutQuart: () => {
        return t => 1-(--t)*t*t*t
    },
    easeInOutQuart: () => {
        return t => t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t
    },
    easeInQuint: () => {
        return t => t*t*t*t*t
    },
    easeOutQuint: () => {
        return t => 1+(--t)*t*t*t*t
    },
    easeInOutQuint: () => {
        return t => t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t
    },
    easeOutElastic: () => {
        return function(t) {
            if (t <= 0) {
                return 0;
            } else if (t >= 1) {
                return 1;
            } else {
                return Math.pow(2, -10 * t) * Math.sin((t - .375) * 20.93) + 1;
            }
        }
    },
    squareWave: (repeat = 1) => {
        const r = 1 / (repeat * 2);
        const r2 = r * 2;
        return function(t) {
            if (t < 1 && t % r2 <= r) {
                return 1;
            } else {
                return 0;
            }
        }
    },
}

'use strict';

Engine.Events =
class Events
{
    constructor(host)
    {
        this._host = host;
        this._events = {};
    }
    _gc(name)
    {
        const events = this._events[name];
        for (let i = 0, l = events.length; i < l; ++i) {
            if (events[i] === undefined) {
                events.splice(i, 1);
                --i;
                --l;
            }
        }
    }
    bind(name, callback)
    {
        if (typeof name !== 'string') {
            throw new TypeError('Event name must be string');
        }
        if (this.bound(name, callback)) {
            return;
        }
        if (!this._events[name]) {
            this._events[name] = [];
        }
        this._events[name].push(callback);
        this._gc(name);
    }
    bound(name, callback)
    {
        return this._events[name] !== undefined &&
               this._events[name].indexOf(callback) !== -1;
    }
    clear()
    {
        this._events = {};
    }
    once(name, callback)
    {
        const events = this;
        events.bind(name, function wrapper() {
            events.unbind(name, wrapper);
            callback.apply(this, arguments);
        });
    }
    trigger(name, values)
    {
        if (this._events[name]) {
            const events = this._events[name];
            const host = this._host;
            /* Notice that this method expects to
               get the arguments to be passed as an
               array as second argument. */
            for (let i = 0, l = events.length; i !== l; ++i) {
                if (events[i] !== undefined) {
                    events[i].apply(host, values);
                }
            }
        }
    }
    unbind(name, callback)
    {
        if (this._events[name]) {
            const events = this._events[name];
            const index = events.indexOf(callback);
            if (index !== -1) {
                events[index] = undefined;
            }
        }
    }
}

'use strict';

Engine.Timer =
class Timer
{
    constructor()
    {
        this.EVENT_RENDER = 'render';
        this.EVENT_UPDATE = 'update';

        this._frameId = null;
        this._isRunning = false;
        this._cancelAnimationFrame = cancelAnimationFrame.bind(window);
        this._requestAnimationFrame = requestAnimationFrame.bind(window);
        this._timeLastEvent = null;
        this._timeStretch = 1;

        this.events = new Engine.Events(this);

        this.eventLoop = this.eventLoop.bind(this);
    }
    _enqueue()
    {
        this._frameId = this._requestAnimationFrame(this.eventLoop);
    }
    eventLoop(millis)
    {
        if (millis !== undefined) {
            const diff = millis - this._timeLastEvent;
            this.updateTime(diff / 1000);
            this._timeLastEvent = millis;
        }
        this.events.trigger(this.EVENT_RENDER);

        if (this._isRunning === true) {
            this._enqueue();
        }
    }
    pause()
    {
        this._cancelAnimationFrame(this._frameId);
        this._isRunning = false;
    }
    run()
    {
        if (this._isRunning) {
            return;
        }
        this._isRunning = true;
        this._timeLastEvent = performance.now();
        this._enqueue();
    }
    setTimeStretch(multiplier)
    {
        this._timeStretch = multiplier;
    }
    updateTime(deltaTime)
    {
        const adjustedDelta = deltaTime * this._timeStretch;
        this.events.trigger(this.EVENT_UPDATE, [adjustedDelta]);
    }
}

Engine.Animation = {
    units: ['x','y','z'],

    vectorTraverse: (subject, desired, speed) => {
        let distance = 0, diff, axis;
        Engine.Animation.units.forEach(axis => {
            if (subject[axis] !== undefined && desired[axis] !== undefined) {
                diff = Engine.Math.clamp(desired[axis] - subject[axis], -speed, speed);
                subject[axis] += diff;
                distance += Math.abs(subject[axis] - desired[axis]);
            }
        });
        return distance;
    },
}

'use strict';

Engine.BitmapFont =
class BitmapFont
{
    constructor(map, size, image)
    {
        this.charMap = map;
        this.charSize = new THREE.Vector2(size.x, size.y);
        this.image = image;
        this.scale = 1;
    }

    createText(string)
    {
        const charSize = this.charSize;

        const lines = string.split("\n");
        const totalLen = lines.reduce((max, line) => Math.max(max, line.length), 0);

        const textSize = new THREE.Vector2(charSize.x * totalLen,
                                           charSize.y * lines.length);

        const textureSize = new THREE.Vector2(Engine.Math.nextPowerOf(textSize.x),
                                              Engine.Math.nextPowerOf(textSize.y));

        const canvas = document.createElement("canvas");

        const scale = this.scale;
        const charMapMod = this.image.width / charSize.x;
        canvas.width = textureSize.x * scale;
        canvas.height = textureSize.y * scale;
        const context = canvas.getContext("2d");
        context.imageSmoothingEnabled = false;

        lines.forEach((chars, line)  => {
            for (let index = 0, char; char = chars[index]; index++) {
                const pos = this.charMap.indexOf(char);
                if (pos === -1) {
                    throw new Error(`Char "${char}" not in map ${this.charMap}`);
                }
                const co = {
                    dx: charSize.x * index * scale,
                    dy: charSize.y * line * scale,
                    dw: charSize.x * scale,
                    dh: charSize.y * scale,
                    sx: (pos % charMapMod) * charSize.x,
                    sy: Math.floor(pos / charMapMod) * charSize.y,
                    sw: charSize.x,
                    sh: charSize.y,
                }
                context.drawImage(this.image,
                                  co.sx, co.sy, co.sw, co.sh,
                                  co.dx, co.dy, co.dw, co.dh);
            }
        });
        const texture = new THREE.Texture(canvas);
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.needsUpdate = true;
        return new Engine.BitmapFont.Text(texture, textSize, textureSize);
    }
}

Engine.BitmapFont.Text = class BitMapFontText
{
    constructor(texture, size, textureSize)
    {
        this._texture = texture;
        this._size = size;
        this._uvMap = new Engine.UVCoords({x: 0, y: 0}, size, textureSize);
    }
    getGeometry()
    {
        const geometry = new THREE.PlaneGeometry(this._size.x, this._size.y);
        geometry.faceVertexUvs[0] = this._uvMap;
        return geometry;
    }
    getMaterial()
    {
        const material = new THREE.MeshBasicMaterial({
            side: THREE.FrontSide,
            map: this.getTexture(),
            transparent: true,
        });
        return material;
    }
    getTexture()
    {
        return this._texture;
    }
    createMesh()
    {
        const geometry = this.getGeometry();
        const material = this.getMaterial();
        return new THREE.Mesh(geometry, material);
    }
}

Engine.Sequencer = function()
{
    this.step = -1;
    this.steps = [];
}

Engine.Sequencer.prototype.addStep = function(callback)
{
    this.steps.push(callback);
}

Engine.Sequencer.prototype.start = function()
{
    this.step = 0;
}

Engine.Sequencer.prototype.stop = function()
{
    this.step = -1;
}

Engine.Sequencer.prototype.run = function(thisArg, args)
{
    if (!this.steps[this.step]) {
        this.stop();
        return false;
    }

    if (this.steps[this.step].apply(thisArg, args)) {
        ++this.step;
    }

    return true;
}

Engine.SyncPromise = class SyncPromise
{
    static all(tasks)
    {
        return new SyncPromise(resolve => {
          let queue = tasks.length;
          let values = [];
          let index = 0;

          function done(index, value) {
              values[index] = value;
              if (--queue === 0) {
                  resolve(values);
              }
          }

          tasks.forEach(task => {
            values.push(null);
            const i = index++;
            if (task != null && typeof task.then === 'function') {
              task.then(val => {
                done(i, val);
              });
            } else {
              done(i, task);
            }
          });
        });
    }
    static resolve(value = null)
    {
        return new SyncPromise(resolve => {
            resolve(value);
        });
    }
    constructor(fn)
    {
        let state = 'pending';
        let value;
        const deferred = [];

        function resolve(newValue) {
          if(newValue && typeof newValue.then === 'function') {
            newValue.then(resolve);
            return;
          }
          value = newValue;
          state = 'resolved';

          deferred.forEach(handle);
        }

        function handle(handler) {
          if(state === 'pending') {
            deferred.push(handler);
            return;
          }

          if(!handler.onResolved) {
            handler.resolve(value);
            return;
          }

          const ret = handler.onResolved(value);
          handler.resolve(ret);
        }

        this.then = function(onResolved) {
          return new SyncPromise(resolve => {
            handle({
              onResolved: onResolved,
              resolve: resolve,
            });
          });
        };

        fn(resolve);
    }
}

'use strict';

Engine.Tween =
class Tween
{
    constructor(to, easing = Engine.Easing.linear())
    {
        this._setGoal(to);
        this._easing = easing;
        this._subjects = [];
    }
    _setGoal(to)
    {
        this._keys = Object.keys(to).filter(key => to[key] != null);
        this._to = to;
    }
    _updateOrigin(subject)
    {
        this._keys.forEach(key => {
            subject.origin[key] = subject.object[key];
        });
    }
    addSubject(object)
    {
        const subject = {
            object,
            origin: {},
        };
        this._updateOrigin(subject);
        this._subjects.push(subject);
    }
    refresh()
    {
        this._subjects.forEach(subject => {
            this._updateOrigin(subject);
        });
    }
    next(to)
    {
        this._setGoal(to);
        this.refresh();
    }
    update(progress)
    {
        const to = this._to;
        const f = this._easing(progress);
        this._subjects.forEach(subject => {
            const origin = subject.origin;
            this._keys.forEach(key => {
                // No intermediate calc necessary for end and start.
                if (f === 0) {
                    subject.object[key] = origin[key];
                } else if (f === 1) {
                    subject.object[key] = to[key];
                } else {
                    subject.object[key] = origin[key] + (to[key] - origin[key]) * f;
                }
            });
        });
    }
}

'use strict';

Engine.Keyboard = class Keyboard
{
    constructor()
    {
        this.EVENT_TRIGGER = 'trigger';

        this.ENGAGE = 'keydown';
        this.RELEASE = 'keyup';

        this.LEFT = 'left';
        this.RIGHT = 'right';
        this.UP = 'up';
        this.DOWN = 'down';
        this.A = 'a';
        this.B = 'b';
        this.SELECT = 'select';
        this.START = 'start';

        this._enabled = true;

        this.events = new Engine.Events(this);
        this._events = new Engine.Events();

        this._map = {
            65: this.LEFT,
            68: this.RIGHT,
            87: this.UP,
            83: this.DOWN,
            80: this.A,
            79: this.B,
            81: this.SELECT,
            69: this.START,
        };

        this._state = {};
    }
    assign(key, name)
    {
        this._map[key] = name;
    }
    enable()
    {
        this._enabled = true;
    }
    disable()
    {
        this._enabled = false;
    }
    exportMap()
    {
        return this._map;
    }
    importMap(map)
    {
        this._map = {};
        Object.keys(map).forEach(code => {
            this.assign(code, map[code]);
        });
    }
    handleEvent(event)
    {
        const key = event.keyCode;
        if (this._map[key]) {
            if (event.preventDefault) {
                event.preventDefault();
            }
            this.trigger(this._map[key], event.type);
        }
    }
    hit(key, engage)
    {
        this._events.bind(key + '_' + this.ENGAGE, engage);
    }
    intermittent(key, engage, release)
    {
        this._events.bind(key + '_' + this.ENGAGE, engage);
        this._events.bind(key + '_' + this.RELEASE, release);
    }
    release()
    {
        Object.keys(this._map).forEach(key => {
            this.trigger(this._map[key], this.RELEASE);
        });
    }
    trigger(key, state)
    {
        if (!this._enabled) {
            return false;
        }

        if (this._state[key] === state) {
            return false;
        }

        this._state[key] = state;
        this._events.trigger(key + '_' + state);
        this.events.trigger(this.EVENT_TRIGGER, [key, state]);

        return true;
    }
    unassign(key)
    {
        this.trigger(this._map[key], this.RELEASE);
        delete this._map[key];
    }
}

Engine.Mouse =
class Mouse
{
    static sluggish(callback, sluggery = 5) {
        let next = 0;
        let count = 0;
        return function handleMouseMove() {
            const now = Date.now();
            if (next < now) {
                count = 0;
                next = now + 500;
            }
            if (++count > sluggery) {
                callback();
            }
        }
    }
}

Engine.Math = {
    ALPHANUM: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    ALPHANUM_LOWER: 'abcdefghijklmnopqrstuvwxyz0123456789',
    ALPHANUM_UPPER: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    ALPHANUM_SAFE: 'abcdefghjkmpqrstuwxyz23456789',

    applyRatio: (ratio, start, end) => {
        return start + (end - start) * ratio;
    },
    clamp: (value, min, max) => {
        if (value > max) {
            return max;
        } else if (value < min) {
            return min;
        } else {
            return value;
        }
    },
    findRatio: (pos, low, high) => {
        return (pos - low) / (high - low);
    },
    nextPowerOf: (x, size = 2) => {
        return Math.pow(size, Math.ceil(Math.log(x) / Math.log(size)));
    },
    round: (value, digits = 0) => {
        const m = Math.pow(10, digits);
        return Math.round(value * m) / m;
    },
    randStr: (len = 6, chars = Engine.Math.ALPHANUM_SAFE) => {
        let id = '';
        while (len--) {
            id += chars[Math.random() * chars.length | 0];
        }
        return id;
    },
}

Engine.Math.Geometry = {
    circlesIntersect: (r1, r2, x1, x2, y1, y2) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const radii = r1 + r2;
        if (dx * dx + dy * dy < radii * radii) {
            return true;
        }
        return false;
    },
    circleInRectangle: (r, x, y, a, b, w, h) => {
        const circle = {
            x: Math.abs(x - a),
            y: Math.abs(y - b),
        }

        if (circle.x > (w / 2 + r) || circle.y > (h / 2 + r)) {
            return false;
        }

        if (circle.x <= (w / 2) || circle.y <= (h / 2)) {
            return true;
        }

        const cornerDistanceSq = Math.pow(circle.x - w / 2, 2) +
                                 Math.pow(circle.y - h / 2, 2);

        if (cornerDistanceSq <= Math.pow(r, 2)) {
            return true;
        }

        return false;
    },
    convertPlaneToRectangle: (geometry) => {
        return {
            'w': Math.abs(geometry.vertices[0].x - geometry.vertices[1].x),
            'h': Math.abs(geometry.vertices[1].y - geometry.vertices[3].y),
        }
    },
    rectanglesIntersect: (x1, y1, w1, h1, x2, y2, w2, h2) => {
        w1 /= 2;
        w2 /= 2;
        h1 /= 2;
        h2 /= 2;
        if (x1 + w1 > x2 - w2 && x1 - w1 < x2 + w2 &&
            y1 + h1 > y2 - h2 && y1 - h1 < y2 + h2) {
            return true;
        }
        return false;
    },
}

'use strict';

Engine.Verlet =
class Verlet
{
    constructor(vec)
    {
        this.components = Object.keys(vec).join('');
        this.vec = vec;
    }
    integrate(result, add, deltaTime)
    {
        const com = this.components;
        for (let c, i = 0; c = com[i]; ++i) {
            result[c] += (this.vec[c] + add[c]) * 0.5 * deltaTime;
            this.vec[c] = add[c];
        }
    }
    reset()
    {
        this.vec.set(0, 0, 0);
    }
}

'use strict';

Engine.Collision =
class Collision
{
    constructor()
    {
        this.objects = [];
        this.collisionIndex = [];
        this.positionCache = [];

        this.garbage = [];

        this.collisionMaxDistanceSq = undefined;
    }
    addObject(object)
    {
        if (object instanceof Engine.Object !== true) {
            throw new TypeError('Collidable wrong type');
        }
        this.objects.push(object);
        this.collisionIndex.push([]);
        this.positionCache.push(new THREE.Vector2().set());
    }
    garbageCollect()
    {
        let object;
        let index;
        while (object = this.garbage.pop()) {
            while ((index = this.objects.indexOf(object)) !== -1) {
                this.objects.splice(index, 1);
                this.collisionIndex.splice(index, 1);
                this.positionCache.splice(index, 1);
           }
        }
    }
    removeObject(object)
    {
        this.garbage.push(object);
    }
    objectNeedsRecheck(index)
    {
        const o = this.objects[index];
        const p = this.positionCache[index];
        if (p.equals(o.position)) {
            return false;
        }
        return true;
    }
    updatePositionCache(index)
    {
        this.positionCache[index].copy(this.objects[index].position);
    }
    detect()
    {
        this.garbageCollect();

        for (let i = 0, l = this.objects.length; i !== l; ++i) {
            if (this.objects[i].collidable && this.objectNeedsRecheck(i)) {
                for (let j = 0; j !== l; ++j) {
                    if (i !== j && this.objects[j].collidable) {
                        this.objectIndexesCollide(i, j);
                    }
                }
            }
        }

        for (let i = 0, l = this.objects.length; i !== l; ++i) {
            this.updatePositionCache(i);
        }
    }
    objectIndexesCollide(i, j)
    {
        const o1 = this.objects[i];
        const o2 = this.objects[j];

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
    objectsCollide(o1, o2)
    {
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
    setCollisionRadius(units)
    {
        this.collisionMaxDistanceSq = units * units;
    }
    zonesCollide(object1, zone1, object2, zone2)
    {
        return Engine.Math.Geometry.rectanglesIntersect(
            zone1.x, zone1.y, zone1.w, zone1.h,
            zone2.x, zone2.y, zone2.w, zone2.h);
    }
}

Engine.Collision.BoundingBox = class BoundingBox
{
    constructor(hostPos, size, offset)
    {
        this.position = hostPos;
        this.offset = offset;

        this.w = size.x;
        this.h = size.y;
        this.width = size.x;
        this.height = size.y;

        this._w = this.w / 2;
        this._h = this.h / 2;
    }
}

Object.defineProperties(Engine.Collision.BoundingBox.prototype, {
    x: {
        get: function() {
            return this.position.x + this.offset.x;
        },
        set: function(v) {
            this.position.x = v - this.offset.x;
        },
    },
    y: {
        get: function() {
            return this.position.y + this.offset.y;
        },
        set: function(v) {
            this.position.y = v - this.offset.y;
        },
    },
    left: {
        get: function() {
            return this.x - this._w;
        },
        set: function(v) {
            this.x = v + this._w;
        },
    },
    right: {
        get: function() {
            return this.x + this._w;
        },
        set: function(v) {
            this.x = v - this._w;
        },
    },
    top: {
        get: function() {
            return this.y + this._h;
        },
        set: function(v) {
            this.y = v - this._h;
        },
    },
    bottom: {
        get: function() {
            return this.y - this._h;
        },
        set: function(v) {
            this.y = v + this._h;
        },
    },
});

'use strict';

Engine.Camera =
class Camera
{
    constructor()
    {
        this.EVENT_UPDATE = 'update';

        this.camera = new THREE.PerspectiveCamera(75, 600 / 400, 0.1, 1000);
        this.desiredPosition = undefined;
        this.events = new Engine.Events(this);
        this.followObject = undefined;
        this.followOffset = new THREE.Vector2(0, 0);
        this.obeyPaths = true;
        this.paths = [];
        this.pathIndex = -1;
        this.position = this.camera.position;
        this.smoothing = 20;
        this.velocity = new THREE.Vector3(0, 0, 0);

        this.doFor = Engine.Loops.doFor(this.events, this.EVENT_UPDATE);
    }
    addPath(path)
    {
        if (path instanceof Engine.Camera.Path === false) {
            throw new TypeError("Invalid camera path");
        }
        this.paths.push(path);
    }
    alignToPath(pos)
    {
        if (this.paths.length === 0) {
            return false;
        }

        this.findPath(pos);

        if (this.pathIndex !== -1) {
            this.paths[this.pathIndex].constrain(pos);
        }

        return true;
    }
    findPath(pos)
    {
        /* If we're inside current path, don't look for a new one. */
        if (this.pathIndex !== -1 && this.paths[this.pathIndex].inWindow(pos)) {
            return;
        }

        for (let i = 0, l = this.paths.length; i !== l; ++i) {
            const path = this.paths[i];
            if (path.inWindow(pos)) {
                this.pathIndex = i;
                return;
            }
        }

        return;
    }
    follow(object, offset)
    {
        this.followObject = object;
        this.desiredPosition = object.position.clone();
        this.desiredPosition.z = this.position.z;
        if (offset === undefined) {
            this.followOffset.set(0, 0);
        } else {
            this.followOffset.copy(offset);
        }
    }
    focusAt(vec)
    {
        this.desiredPosition = vec.clone();
    }
    jumpTo(vec)
    {
        this.position.x = vec.x;
        this.position.y = vec.y;
        this.position.z = vec.z || this.position.z;
    }
    jumpToPath(vec)
    {
        this.jumpTo(vec);
        this.alignToPath(this.position);
    }
    panTo(pos, duration, easing = Engine.Easing.linear())
    {
        this.desiredPosition = undefined;
        const tween = new Engine.Tween(pos, easing);
        tween.addSubject(this.position);
        return this.doFor(duration, (elapsed, progress) => {
            tween.update(progress);
        });
    }
    unfollow()
    {
        this.followObject = undefined;
        this.desiredPosition = undefined;
    }
    updateTime(deltaTime)
    {
        this.events.trigger(this.EVENT_UPDATE, [deltaTime]);

        if (this.followObject) {
            this.desiredPosition.x = this.followObject.position.x + this.followOffset.x;
            this.desiredPosition.y = this.followObject.position.y + this.followOffset.y;
        }

        if (this.desiredPosition) {
            if (this.obeyPaths) {
                this.alignToPath(this.desiredPosition);
            }
            this.velocity.copy(this.desiredPosition).sub(this.position);
            if (this.smoothing > 0) {
                this.velocity.divideScalar(this.smoothing);
            }
        }

        this.position.add(this.velocity);
    }
}

Engine.Camera.Path = class CameraPath
{
    constructor()
    {
        this.constraint = [
            new THREE.Vector3(),
            new THREE.Vector3(),
        ];
        this.window = [
            new THREE.Vector2(),
            new THREE.Vector2(),
        ];
    }
    constrain(vec)
    {
        vec.clamp(this.constraint[0], this.constraint[1]);
    }
    inWindow(vec)
    {
        return vec.x >= this.window[0].x
            && vec.x <= this.window[1].x
            && vec.y >= this.window[0].y
            && vec.y <= this.window[1].y;
    }
    setConstraint(x1, y1, x2, y2)
    {
        this.constraint[0].x = x1;
        this.constraint[0].y = y1;
        this.constraint[1].x = x2;
        this.constraint[1].y = y2;
    }
    setWindow(x1, y1, x2, y2)
    {
        this.window[0].x = x1;
        this.window[0].y = y1;
        this.window[1].x = x2;
        this.window[1].y = y2;
    }
}

'use strict';

Engine.World =
class World
{
    constructor()
    {
        this.EVENT_UPDATE = 'world-update';
        this.EVENT_SIMULATE = 'world-simulate';
        this.EVENT_EMIT_AUDIO = 'world-emit-audio';
        this.EVENT_ADD = 'world-add';
        this.EVENT_REMOVE = 'world-remove';

        this.ambientLight = new THREE.AmbientLight(0xffffff);

        this.collision = new Engine.Collision();

        this.events = new Engine.Events(this);
        this.doFor = Engine.Loops.doFor(this.events, this.EVENT_SIMULATE);
        this.waitFor = Engine.Loops.waitFor(this.events, this.EVENT_SIMULATE);

        this.atmosphericDensity = .1;
        this.atmosphericViscosity = .1;
        this.gravityForce = new THREE.Vector2(0, 9.81);
        this.windForce = new THREE.Vector2(0, 0);

        this.objects = [];
        this.objectsDead = [];

        this.scene = new THREE.Scene();
        this.scene.add(this.ambientLight);

        this._accumulator = 0;
        this._tick = 0;
        this._timeTotal = 0;

        this.timeStep = 1/120;
        this.timeStretch = 1;
    }
    addObject(object)
    {
        if (object instanceof Engine.Object === false) {
            throw new TypeError('Invalid object');
        }
        if (this.hasObject(object)) {
            return;
        }

        this.objects.push(object);
        this.objectsDead.push(false);
        this.collision.addObject(object);
        if (object.model) {
            this.scene.add(object.model);
        }
        object.setWorld(this);
        object.events.trigger(this.EVENT_ADD);
    }
    emitAudio(positionalAudio)
    {
        this.events.trigger(this.EVENT_EMIT_AUDIO, [positionalAudio]);
    }
    getObject(id)
    {
        for (let i = 0, l = this.objects.length; i !== l; ++i) {
            const object = this.objects[i];
            if (object.id === id) {
                return object;
            }
        }
        return false;
    }
    getObjects(name) {
        return this.objects.filter(o => o.name === name);
    }
    hasObject(object)
    {
        const index = this.objects.indexOf(object);
        return index !== -1 && this.objectsDead[index] === false;
    }
    removeObject(object)
    {
        if (object instanceof Engine.Object === false) {
            throw new TypeError('Invalid object');
        }
        const index = this.objects.indexOf(object);
        if (index !== -1) {
            this.objectsDead[index] = true;
            object.events.trigger(this.EVENT_REMOVE);
        }
    }
    _cleanObjects()
    {
        const dead = this.objectsDead;
        const objects = this.objects;
        for (let i = 0, l = objects.length; i !== l;) {
            if (dead[i] === true) {
                this._cleanObject(objects[i]);
                objects.splice(i, 1);
                dead.splice(i, 1);
                --l;
            } else {
                ++i;
            }
        }
    }
    _cleanObject(object)
    {
        object.unsetWorld();
        this.collision.removeObject(object);
        if (object.model) {
            this.scene.remove(object.model);
        }
    }
    simulateTime(deltaTime)
    {
        this._timeTotal += deltaTime;

        this.objects.forEach(object => {
            object.timeShift(deltaTime, this._timeTotal);
        });

        this.collision.detect();

        this._cleanObjects();

        if (deltaTime > 0) {
            this.events.trigger(this.EVENT_SIMULATE, [deltaTime, this._timeTotal, this._tick]);
            ++this._tick;
        }
    }
    updateAnimation(deltaTime)
    {
        this.objects.forEach(object => {
            object.updateAnimators(deltaTime);
        });
    }
    updateTime(deltaTime)
    {
        const adjustedDelta = deltaTime * this.timeStretch;
        const step = this.timeStep;

        this._accumulator += adjustedDelta;
        while (this._accumulator >= step) {
            this.simulateTime(step);
            this._accumulator -= step;
        }

        this.updateAnimation(adjustedDelta);
        this.events.trigger(this.EVENT_UPDATE, [adjustedDelta, this._timeTotal]);
    }
}
'use strict';

Engine.Object = function()
{
    this.uuid = THREE.Math.generateUUID();
    this.name = undefined;

    this.aim = new THREE.Vector2();
    this.anim = undefined;
    this.animators = [];
    this.collidable = true;
    this.collision = [];
    this.deltaTime = undefined;
    this.direction = new THREE.Vector2(this.DIRECTION_RIGHT, 0);
    this.emitter = undefined;
    this.events = new Engine.Events(this);
    this.id = undefined;
    this.integrator = new Engine.Verlet(new THREE.Vector2);
    this.origo = new THREE.Vector2();
    this.position = new THREE.Vector3();
    this.sequencer = new Engine.SequenceManager(this);
    this.time = 0;
    this.timeStretch = 1;
    this.traits = [];
    this.velocity = new THREE.Vector2;
    this.world = undefined;

    this.doFor = Engine.Loops.doFor(this.events, this.EVENT_TIMESHIFT);
    this.waitFor = Engine.Loops.waitFor(this.events, this.EVENT_TIMESHIFT);

    if (this.geometry && this.material) {
        this.setModel(new THREE.Mesh(this.geometry, this.material));
    }
}

Engine.Object.prototype.DIRECTION_UP = 1;
Engine.Object.prototype.DIRECTION_DOWN = -1;
Engine.Object.prototype.DIRECTION_LEFT = -1;
Engine.Object.prototype.DIRECTION_RIGHT = 1;

Engine.Object.prototype.EVENT_WORLD_ADD = 'world-add';
Engine.Object.prototype.EVENT_WORLD_REMOVE = 'world-remove';

Engine.Object.prototype.EVENT_COLLIDE = 'collide';
Engine.Object.prototype.EVENT_OBSTRUCT = 'obstruct';
Engine.Object.prototype.EVENT_TIMESHIFT = 'timeshift';
Engine.Object.prototype.EVENT_UNCOLLIDE = 'uncollide';

Engine.Object.prototype.EVENT_TRAIT_ATTACHED = 'trait-attached';

Engine.Object.prototype.SURFACE_TOP = 0;
Engine.Object.prototype.SURFACE_BOTTOM = 1;
Engine.Object.prototype.SURFACE_LEFT = 2;
Engine.Object.prototype.SURFACE_RIGHT = 3;

Engine.Object.prototype.audio = {};
Engine.Object.prototype.geometry = undefined;
Engine.Object.prototype.material = undefined;
Engine.Object.prototype.textures = {};

Engine.Object.prototype.addCollisionRect = function(w, h, offsetX, offsetY)
{
    const boundingBox = new Engine.Collision.BoundingBox(
        this.position,
        {x: w, y: h},
        {x: offsetX || 0, y: offsetY || 0}
    );
    this.collision.push(boundingBox);
}

Engine.Object.prototype.addCollisionZone = function(r, offsetX, offsetY)
{
    return this.addCollisionRect(r * 2, r * 2, offsetX, offsetY);
}

Engine.Object.prototype.applyTrait = function(trait)
{
    if (trait instanceof Engine.Trait === false) {
        console.error(trait);
        throw new Error('Invalid trait');
    }
    if (this[trait.NAME] !== undefined) {
        throw new Error('Trait name "' + trait.NAME + '" occupied');
    }
    trait.__attach(this);
    this.traits.push(trait);
    this[trait.NAME] = trait;
    this.events.trigger(this.EVENT_TRAIT_ATTACHED, [trait]);
}

Engine.Object.prototype.collides = function(withObject, ourZone, theirZone)
{
    this.events.trigger(this.EVENT_COLLIDE, [withObject, ourZone, theirZone]);
}

Engine.Object.prototype.dropCollision = function()
{
    this.collision.length = 0;
}

Engine.Object.prototype.emitAudio = function(audio)
{
    if (this.world) {
        this.world.emitAudio(audio);
    }
}

Engine.Object.prototype.getModel = function()
{
    return this.model;
}

Engine.Object.prototype.getTrait = function(traitReference)
{
    for (let i = 0, l = this.traits.length; i < l; ++i) {
        if (this.traits[i] instanceof traitReference) {
            return this.traits[i];
        }
    }
    return false;
}

Engine.Object.prototype.moveTo = function(vec)
{
    this.position.x = vec.x;
    this.position.y = vec.y;
}

Engine.Object.prototype.nudge = function(x, y)
{
    const vec = this.position.clone();
    vec.x += x || 0;
    vec.y += y || 0;
    this.moveTo(vec);
}

Engine.Object.prototype.obstruct = function(object, attack, ourZone, theirZone)
{
    this.events.trigger(this.EVENT_OBSTRUCT, [object, attack, ourZone, theirZone]);
}

Engine.Object.prototype.reset = function()
{
    this.aim.set(0, 0);
    this.traits.forEach(trait => {
        if (typeof trait.reset === 'function') {
            trait.reset();
        }
    });
}

Engine.Object.prototype.removeFromWorld = function()
{
    if (this.world) {
        this.world.removeObject(this);
    }
}

Engine.Object.prototype.routeAnimation = function()
{
    return null;
}

Engine.Object.prototype.setAnimation = function(name)
{
    if (name !== this.anim) {
        this.animators[0].setAnimation(this.animations[name]);
        this.anim = name;
    }
}

Engine.Object.prototype.setEmitter = function(object)
{
    if (object instanceof Engine.Object !== true) {
        throw new Error('Invalid emitter');
    }
    this.emitter = object;
}

Engine.Object.prototype.setModel = function(model)
{
    this.model = model;
    this.position = this.model.position;
}

Engine.Object.prototype.setWorld = function(world)
{
    if (world instanceof Engine.World === false) {
        throw new Error('Invalid world');
    }
    this.world = world;
    this.events.trigger(this.EVENT_WORLD_ADD);
}

Engine.Object.prototype.timeShift = function(deltaTime)
{
    const adjustedDelta = deltaTime * this.timeStretch;
    this.deltaTime = adjustedDelta;

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

Engine.Object.prototype.updateAnimators = function(deltaTime)
{
    const adjustedDelta = deltaTime * this.timeStretch;
    this.animators.forEach(animator => {
        animator.update(adjustedDelta);
    });
}

Engine.Object.prototype.uncollides = function(withObject)
{
    this.events.trigger(this.EVENT_UNCOLLIDE, [withObject]);
}

Engine.Object.prototype.unsetWorld = function() {
    this.events.trigger(this.EVENT_WORLD_REMOVE);
    this.world = undefined;
}

Engine.objects = {};
Engine.objects.characters = {};

Engine.SequenceManager =
class SequenceManager
{
    constructor(host)
    {
        this._host = host;
        this._sequences = {};
    }
    addSequence(id, sequence)
    {
        if (this._sequences[id]) {
            throw new Error(`Sequence id '${id}' already defined`);
        }
        this._sequences[id] = sequence;
    }
    getSequence(id)
    {
        if (!this._sequences[id]) {
            throw new Error(`Sequence id '${id}' not defined`);
        }
        return this._sequences[id];
    }
    playSequence(id)
    {
        const sequence = this.getSequence(id);
        const steps = [];

        const next = () => {
            if (steps.length) {
                const tasks = [];
                steps.shift().forEach(action => {
                    tasks.push(action.call(this._host));
                });
                return Engine.SyncPromise.all(tasks).then(() => {
                    return next();
                });
            }
        };

        sequence.forEach(step => {
            const actions = [];
            step.forEach(action => {
                actions.push(action);
            });
            steps.push(actions);
        });

        return next();
    }
}

'use strict';

Engine.Timeline =
class Timeline
{
    constructor()
    {
        this.name = undefined;

        this.accumulatedTime = 0;
        this.totalDuration = 0;

        this.frames = [];
    }
    addFrame(value, duration)
    {
        this.frames.push({
            duration,
            value,
        });
        this.totalDuration += duration;
    }
    getIndex()
    {
        return this.getIndexAtTime(this.accumulatedTime);
    }
    getIndexAtTime(time)
    {
        return this.resolveTime(time).index;
    }
    getLoopTime(time)
    {
        if (isFinite(this.totalDuration)) {
            return (time % this.totalDuration + this.totalDuration) % this.totalDuration;
        }
        return time;
    }
    getValue()
    {
        return this.resolveTime(this.accumulatedTime).value;
    }
    getValueAtIndex(index)
    {
        return this.frames[index].value;
    }
    getValueAtTime(time)
    {
        return this.resolveTime(time).value;
    }
    resolveTime(totalTime)
    {
        /*
            Because all JavaScript numbers are floats with finite precision
            there's a chance this will crash because the accumulative durations
            are less than infiniteTime.
        */
        const time = this.getLoopTime(totalTime);

        let i = 0;
        let incrementalTime = 0;
        let index = 0;

        do {
            index = i++;
            incrementalTime = incrementalTime + this.frames[index].duration;
        }
        while (time >= incrementalTime);

        return {
            index: index,
            value: this.frames[index].value,
            passedLength: incrementalTime - this.frames[index].duration,
            resolvedLength: time,
        };
    }
    reset()
    {
        this.accumulatedTime = 0;
    }
}

'use strict';

Engine.UVCoords =
class UVCoords extends Array
{
    constructor(offset, size, txSize)
    {
        super();

        const x = offset.x;
        const y = offset.y;
        const w = size.x;
        const h = size.y;
        const totalW = txSize.x;
        const totalH = txSize.y;

        const uvs = [
            new THREE.Vector2(x / totalW, (totalH - y) / totalH),
            new THREE.Vector2(x / totalW, (totalH - (y + h)) / totalH),
            new THREE.Vector2((x + w) / totalW, (totalH - (y + h)) / totalH),
            new THREE.Vector2((x + w) / totalW, (totalH - y) / totalH),
        ];

        this.push([uvs[0], uvs[1], uvs[3]],
                  [uvs[1], uvs[2], uvs[3]]);
    }
}

'use strict';

Engine.Animator =
class Animator
{
    constructor()
    {
        this._currentAnimation = null;
        this._currentGroup = null;
        this._currentIndex = null;

        this.name = '';

        this.offset = 0;
        this.time = 0;
    }

    _applyAnimation()
    {
        throw new Error('_applyAnimation not implemented');
    }

    reset()
    {
        this.time = this.offset;
    }

    setAnimation(animation)
    {
        if (this._currentAnimation === animation) {
            return;
        }

        if (animation.group === null || animation.group !== this._currentGroup) {
            this.reset();
        }

        this._currentGroup = animation.group;
        this._currentIndex = null;
        this._currentAnimation = animation;
    }

    update(deltaTime)
    {
        this.time += deltaTime || 0;
        this._applyAnimation(this._currentAnimation);
    }
}

Engine.Animator.Animation =
class Animation
{
    constructor(id, group = null)
    {
        this._value = null;
        this._duration = null;

        this.id = id;
        this.group = group;

        this.length = 0;
        this.timeline = null;
    }

    addFrame(value, duration)
    {
        /* If this is the first time addFrame is run,
           save the value and duration flat, since we
           will not need the Timeline class to resolve it. */
        if (this._value === null) {
            this.length = 1;
            this._value = value;
            this._duration = duration;
        }
        /* If addFrame is run more than once, create Timeline
           object, copy static frame to Timeline and tranform
           behavior to a multi frame Animation. */
        else {
            if (this.timeline === null) {
                this.timeline = new Engine.Timeline();
                this.timeline.addFrame(this._value, this._duration);
                this._value = null;
                this._duration = null;
            }

            this.timeline.addFrame(value, duration);
            ++this.length;
        }
    }

    getIndex(time)
    {
        if (this.timeline === null) {
            return 0;
        } else {
            return this.timeline.getIndexAtTime(time);
        }
    }

    getValue(index)
    {
        if (this.timeline === null) {
            return this._value;
        } else {
            return this.timeline.getValueAtIndex(index);
        }
    }
}

'use strict';

Engine.Animator.UV =
class UVAnimator extends Engine.Animator
{
    constructor()
    {
        super();
        this.geometries = [];
        this.indices = [0];
    }

    _applyAnimation(animation)
    {
        const animationIndex = animation.getIndex(this.time + this.offset);
        if (animationIndex === this._currentIndex) {
            return;
        }

        const uv = animation.getValue(animationIndex);
        this.geometries.forEach(geo => {
            this.indices.forEach(faceIndex => {
                geo.faceVertexUvs[0][faceIndex] = uv[0];
                geo.faceVertexUvs[0][faceIndex+1] = uv[1];
            });
            geo.uvsNeedUpdate = true;
        });

        this._currentIndex = animationIndex;
    }

    addGeometry(geometry)
    {
        if (geometry instanceof THREE.Geometry === false) {
            throw new TypeError('Invalid geometry');
        }
        this.geometries.push(geometry);
    }

    clone(animation)
    {
        const anim = new Engine.Animator.UV();
        anim._currentAnimation = this._currentAnimation;
        anim._currentGroup = this._currentGroup;
        anim._currentIndex = this._currentIndex;
        anim.indices = this.indices;
        anim.offset = this.offset;
        anim.name = this.name;
        this.geometries.forEach(geo => anim.addGeometry(geo));
        return anim;
    }
}

Engine.logic.Energy =
class Energy
{
    constructor(max = 100, min = 0)
    {
        this.EVENT_CHANGE = 'change';

        this.events = new Engine.Events(this);

        this._max = max;
        this._min = min;
        this._value = max;

        this.infinite = false;
    }
    get amount()
    {
        return this._value;
    }
    set amount(value)
    {
        if (!isFinite(value)) {
            throw new TypeError('Value not a number');
        }

        const current = this._value;

        if (this.infinite === true) {
            return;
        } else if (value > this._max) {
            this._value = this._max;
        } else if (value < this._min) {
            this._value = this._min;
        } else {
            this._value = value;
        }

        if (current !== this._value) {
            this.events.trigger(this.EVENT_CHANGE);
        }
    }
    deplete()
    {
        this.amount = this._min;
    }
    get depleted()
    {
        return this._value <= this._min;
    }
    get fraction()
    {
        if (this.infinite === true || this._max === this._min) {
            return 1;
        } else {
            var total = Math.abs(this._max - this._min);
            var rest = Math.abs(this._value - this._min);
            return rest / total;
        }
    }
    fill()
    {
        this.amount = this._max;
    }
    get full()
    {
        return this._value >= this._max;
    }
    get max()
    {
        return this._max;
    }
    set max(v)
    {
        if (!isFinite(v)) {
            throw new TypeError('Value not a number');
        }

        this._max = v;
        if (this._max < this._value) {
            this.amount = this._max;
        }
    }
    get min()
    {
        return this._min;
    }
    set min(v)
    {
        if (!isFinite(v)) {
            throw new TypeError('Value not a number');
        }

        this._min = v;
        if (this._min > this._value) {
            this.amount = this._min;
        }
    }
}

Engine.Loops = {
    doFor: function(events, event) {
        return function doFor(duration, callback) {
            if (duration <= 0) {
                if (callback) {
                    callback(0, 1);
                }
                return Engine.SyncPromise.resolve();
            }

            let elapsed = 0;
            let progress = 0;
            return new Engine.SyncPromise(resolve => {
                function doForWrapper(dt, total, tick) {
                    elapsed += dt;
                    progress = elapsed / duration;
                    if (progress >= 1) {
                        progress = 1;
                        events.unbind(event, doForWrapper);
                    }
                    if (callback) {
                        callback(elapsed, progress);
                    }
                    if (progress === 1) {
                        resolve({
                            elapsed,
                            tick,
                            offset: elapsed - duration,
                            total: total,
                        });
                    }
                }
                events.bind(event, doForWrapper);
            });
        }
    },
    waitFor: function(events, event) {
        const doFor = Engine.Loops.doFor(events, event);
        return function waitFor(seconds) {
            return doFor(seconds);
        }
    },
}

Engine.Trait =
class Trait
{
    constructor()
    {
        this.NAME = null;

        this._bindables = {};
        this._enabled = true;
        this._host = null;
        this._requires = [];

        this.MAGIC_METHODS = {
            '__collides':   Engine.Object.prototype.EVENT_COLLIDE,
            '__obstruct':   Engine.Object.prototype.EVENT_OBSTRUCT,
            '__uncollides': Engine.Object.prototype.EVENT_UNCOLLIDE,
            '__timeshift':  Engine.Object.prototype.EVENT_TIMESHIFT,
        }

        this.EVENT_ATTACHED = 'attached';
        this.EVENT_DETACHED = 'detached';

        this.events = new Engine.Events(this);

        /* Bind on instantiation so that
           they can be found when unbound. */
        Object.keys(this.MAGIC_METHODS).forEach(method => {
            if (this[method]) {
                this[method] = this[method].bind(this);
                this._bindables[method] = this[method];
            }
        });
    }
    __attach(host)
    {
        if (host instanceof Engine.Object === false) {
            throw new TypeError('Invalid host');
        }
        if (this._host !== null) {
            throw new Error('Already attached');
        }

        this._requires.forEach(ref => {
            this.__require(host, ref);
        });

        this._host = host;

        const events = this._host.events;
        Object.keys(this._bindables).forEach(method => {
            events.bind(this.MAGIC_METHODS[method], this[method]);
        });

        this.events.trigger(this.EVENT_ATTACHED, [this._host]);
    }
    __detach()
    {
        const events = this._host.events;
        Object.keys(this._bindables).forEach(method => {
            events.unbind(this.MAGIC_METHODS[method], this[method]);
        });

        this.events.trigger(this.EVENT_DETACHED, [this._host]);
        this._host = null;
    }
    __require(host, traitReference)
    {
        const trait = host.getTrait(traitReference);
        if (trait !== false) {
            return trait;
        }
        throw new Error('Required trait "' + new traitReference().NAME + '" not found');
    }
    __requires(traitReference)
    {
        this._requires.push(traitReference);
    }
    _bind(name, callback)
    {
        this._host.events.bind(name, callback);
    }
    _trigger(name, values)
    {
        this._host.events.trigger(name, values);
    }
    _unbind(name, callback)
    {
        this._host.events.unbind(name, callback);
    }
    disable()
    {
        this._enabled = false;
    }
    enable()
    {
        this._enabled = true;
    }
}

Engine.traits = {};

'use strict';

Engine.CanvasUtil = {
    clone: function(canvas) {
        const clone = document.createElement('canvas');
        const context = clone.getContext('2d');
        clone.width = canvas.width;
        clone.height = canvas.height;
        context.drawImage(canvas, 0, 0);
        return clone;
    },
    colorReplace: function(canvas, rgbIn, rgbOut) {
        const context = canvas.getContext("2d");
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = pixels.data;
        for (let i = 0, l = data.length; i < l; i += 4) {
            if (data[i]   === rgbIn.x &&
                data[i+1] === rgbIn.y &&
                data[i+2] === rgbIn.z) {
                data[i]   = rgbOut.x;
                data[i+1] = rgbOut.y;
                data[i+2] = rgbOut.z;
            }
        }
        context.putImageData(pixels, 0, 0);
        return canvas;
    },
    scale: function(canvas, scale) {
        const w = canvas.width * scale;
        const h = canvas.height * scale;
        const scaled = document.createElement('canvas');
        scaled.width = w;
        scaled.height = h;
        const context = scaled.getContext("2d");
        context.imageSmoothingEnabled = scale < 1;
        context.drawImage(canvas, 0, 0, w, h);
        return scaled;
    },
}

'use strict';

Engine.InputPlayer =
class InputPlayer
{
    constructor(world, input)
    {
        this._world = world;
        this._input = input;
        this._abort = null;
    }
    play(log)
    {
        const world = this._world;
        const input = this._input;
        let i = 0;
        let next = log[0].tick;
        return new Promise((resolve, reject) => {
            function onSimulate(dt, t, tick) {
                while (tick === next) {
                    input.trigger(log[i].key, log[i].type);
                    if (log[++i]) {
                        next = log[i].tick;
                    } else {
                        stop();
                        resolve();
                        break;
                    }
                }
            }

            function stop() {
                world.events.unbind(world.EVENT_SIMULATE, onSimulate);
            }

            this._abort = (err) => {
                stop();
                reject(err);
            };

            world.events.bind(world.EVENT_SIMULATE, onSimulate);
        });
    }
    playJSON(json)
    {
        const log = JSON.parse(json);
        return this.play(log);
    }
    stop()
    {
        this._abort(new Error('Stopped'));
        this._abort = null;
    }
}

'use strict';

Engine.InputRecorder =
class InputRecorder
{
    constructor(world, input)
    {
        this._world = world;
        this._input = input;
        this._log = [];

        this._listener = (key, type) => {
            this._log.push({
                tick: this._world._tick,
                key: key,
                type: type,
            });
        };
    }
    getLog()
    {
        return this._log;
    }
    record()
    {
        const input = this._input;
        input.events.bind(input.EVENT_TRIGGER, this._listener);
    }
    stop()
    {
        const input = this._input;
        input.events.unbind(input.EVENT_TRIGGER, this._listener);
    }
    toJSON()
    {
        return JSON.stringify(this._log);
    }
}

Engine.AI = function(object)
{
    this.object = object;
    this.target = undefined;
}

Engine.AI.prototype.faceObject = function(object)
{
    this.object.direction.x = object.position.x > this.object.position.x
        ? this.object.DIRECTION_RIGHT
        : this.object.DIRECTION_LEFT;
}

Engine.AI.prototype.faceTarget = function()
{
    if (!this.target) {
        return false;
    }
    return this.faceObject(this.target);
}

Engine.AI.prototype.findPlayer = function()
{
    if (this.target && this.target.isPlayer) {
        return this.target;
    }

    var objects = this.object.world.objects;
    for (var i = 0, l = objects.length; i !== l; ++i) {
        if (objects[i] !== undefined) {
            var o = objects[i];
            if (o.isPlayer) {
                this.setTarget(o);
                return o;
            }
        }
    }
    return false;
}

Engine.AI.prototype.setTarget = function(object)
{
    if (object instanceof Engine.Object !== true) {
        throw new Error("Target must be object");
    }
    this.target = object;
}

Engine.Game = class Game
{
    constructor()
    {
        this.EVENT_SCENE_SET = 'scene_set';
        this.EVENT_SCENE_CREATE = 'scene_create';
        this.EVENT_SCENE_DESTROY = 'scene_destroy';
        this.EVENT_SCENE_UNSET = 'scene_unset';

        this._paused = null;
        this._playbackSpeed = 1;

        this.input = new Engine.Keyboard;
        this.events = new Engine.Events(this);
        this.audioPlayer = new Engine.AudioPlayer();
        this.renderer = new THREE.WebGLRenderer({
            'antialias': false,
        });

        this.player = new Engine.Player();

        this.element = null;
        this.scene = null;

        this.handleInputEvent = this.handleInputEvent.bind(this);
        this.pause();
    }
    destroy()
    {
        this.audioPlayer.destroy();
    }
    attachController(element)
    {
        element.addEventListener('keydown', this.handleInputEvent);
        element.addEventListener('keyup', this.handleInputEvent);
    }
    attachToElement(element)
    {
        this.element = element;
        this.adjustResolution();
        this.element.appendChild(this.renderer.domElement);
    }
    adjustAspectRatio()
    {
        if (this.scene && this.element) {
            const rect = this.element.getBoundingClientRect();
            const cam = this.scene.camera.camera;
            cam.aspect = rect.width / rect.height;
            cam.updateProjectionMatrix();
        }
    }
    adjustResolution()
    {
        const rect = this.element.getBoundingClientRect();
        this.setResolution(rect.width, rect.height);
    }
    handleInputEvent(event)
    {
        this.input.handleEvent(event);
    }
    pause()
    {
        if (this._paused === true) {
            return;
        }
        this._paused = true;
        this.audioPlayer.pause();
        this.input.disable();
        if (this.scene) {
            this.scene.events.trigger(this.scene.EVENT_PAUSE);
        }
    }
    resume()
    {
        if (this._paused === false) {
            return;
        }
        this._paused = false;
        this.audioPlayer.resume();
        this.input.enable();
        if (this.scene) {
            this.scene.events.trigger(this.scene.EVENT_RESUME);
        }
    }
    render()
    {
        this.scene.render();
    }
    setPlaybackSpeed(rate)
    {
        this._playbackSpeed = rate;
        this._updatePlaybackSpeed();
    }
    _updatePlaybackSpeed()
    {
        if (this.scene) {
            this.scene.timer.setTimeStretch(this._playbackSpeed);
        }
        this.audioPlayer.setPlaybackRate(this._playbackSpeed);
    }
    setResolution(w, h)
    {
        this.renderer.setSize(w, h);
        this.renderer.domElement.removeAttribute("style");
    }
    setScene(scene)
    {
        if (scene instanceof Engine.Scene === false) {
            throw new Error('Invalid scene');
        }

        this.unsetScene();

        this.scene = scene;
        this.input.release();
        this.scene.events.trigger(this.scene.EVENT_CREATE, [this]);
        this.events.trigger(this.EVENT_SCENE_CREATE, [this.scene]);
        this.events.trigger(this.EVENT_SCENE_SET, [this.scene]);

        /* Because the camera is instantiated per scene,
           we make sure the aspect ratio is correct before
           we roll. */
        this.adjustAspectRatio();
        this._updatePlaybackSpeed();

        this.scene.events.trigger(this.scene.EVENT_START);

        if (!this._paused) {
            this.scene.events.trigger(this.scene.EVENT_RESUME);
        }
    }
    unsetScene()
    {
        if (this.scene) {
            this.events.trigger(this.EVENT_SCENE_UNSET, [this.scene]);
            this.events.trigger(this.EVENT_SCENE_DESTROY, [this.scene]);
            this.scene.events.trigger(this.scene.EVENT_DESTROY);
            this.scene = null;
        }
    }
}

'use strict';

Engine.ResourceManager =
class ResourceManager
{
    constructor()
    {
        /* These must be defined in order of specificity. */
        this.TYPE_MAP = {
            'weapon': Engine.objects.Weapon,
            'object': Engine.Object,
            'texture': THREE.Texture,
        }

        this._items = {};
    }
    _addResource(type, id, object)
    {
        if (!type) {
            throw new Error('Empty type');
        }
        if (!id) {
            throw new Error('Empty id');
        }
        if (!this._items[type]) {
            this._items[type] = {};
        }
        if (this._items[type][id]) {
            throw new Error("Object " + id + " already defined");
        }

        this._items[type][id] = object;
    }
    addAuto(id, object)
    {
        for (let type in this.TYPE_MAP) {
            const proto = this.TYPE_MAP[type].prototype;
            if (proto.isPrototypeOf(object.prototype)) {
                this._addResource(type, id, object);
                return true;
            }
        }
        throw new Error('Could not determine type from ' + object);
    }
    addAudio(id, object)
    {
        return this._addResource('audio', id, object);
    }
    addFont(id, object)
    {
        return this._addResource('font', id, object);
    }
    addObject(id, object)
    {
        return this._addResource('object', id, object);
    }
    addTexture(id, object)
    {
        return this._addResource('texture', id, object);
    }
    addWeapon(id, object)
    {
        return this._addResource('weapon', id, object);
    }
    get(type, id)
    {
        if (this._items[type] && this._items[type][id]) {
            return this._items[type][id];
        }
        throw new Error('No resource "' + id + '" of type ' + type);
    }
    has(type, id)
    {
        return this._items[type] !== undefined &&
               this._items[type][id] !== undefined;
    }
}

'use strict';

Engine.ResourceLoader =
class ResourceLoader
{
    constructor(loader)
    {
        this.EVENT_COMPLETE = 'complete';
        this.EVENT_PROGRESS = 'progress';

        this.loader = loader;

        this.events = new Engine.Events(this);

        this.PENDING = 0;
        this.RUNNING = 1;
        this.COMPLETE = 2;

        this._tasks = [];
        this._started = 0;
        this._completed = 0;
    }
    _createTask()
    {
        const task = {
            status: this.PENDING,
            promise: null,
        };
        this._tasks.push(task);
        ++this._started;
        this.events.trigger(this.EVENT_PROGRESS, [this.progress()]);
        return task;
    }
    _completeTask(task)
    {
        task.status = this.COMPLETE;
        ++this._completed;
        this.events.trigger(this.EVENT_PROGRESS, [this.progress()]);
    }
    complete()
    {
        const tasks = this._tasks.map(task => {
            return task.promise;
        });
        this._tasks = [];
        return Promise.all(tasks).then(() => {
            this._started = 0;
            this._completed = 0;
            this.events.trigger(this.EVENT_PROGRESS, [1]);
            this.events.trigger(this.EVENT_COMPLETE);
        });
    }
    progress()
    {
        return this._completed / this._started;
    }
    loadAudio(url)
    {
        const task = this._createTask();
        const context = this.loader.game.audioPlayer.getContext();
        task.promise = fetch(url)
            .then(response => {
                return response.arrayBuffer();
            })
            .then(arrayBuffer => {
                return context.decodeAudioData(arrayBuffer);
            })
            .then(buffer => {
                this._completeTask(task);
                return new Engine.Audio(buffer);
            });
        return task.promise;
    }
    loadImage(url)
    {
        const task = this._createTask();
        task.promise = new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => {
                const canvas = Engine.CanvasUtil.clone(image);
                resolve(canvas);
                this._completeTask(task);
            });
            image.addEventListener('error', reject);
            image.src = url;
        });
        return task.promise;
    }
    loadXML(url)
    {
        const task = this._createTask();
        task.promise = fetch(url)
            .then(response => {
                return response.text();
            })
            .then(text => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/xml');
                doc.baseURL = url;
                this._completeTask(task);
                return doc;
            });
        return task.promise;
    }
}

Engine.Loader = function(game)
{
    this.game = game;
    this.resourceManager = new Engine.ResourceManager(this);
    this.resourceLoader = new Engine.ResourceLoader(this);

    this.textureScale = 1;
}

'use strict';

Engine.Loader.XML =
class XMLLoader
extends Engine.Loader
{
    constructor(game)
    {
        super(game);
        this.entryPoint = null;
        this.sceneIndex = {};
    }
    asyncLoadXML(url)
    {
        return this.resourceLoader.loadXML(url);
    }
    followNode(node)
    {
        const url = this.resolveURL(node, 'src');
        if (!url) {
            return Promise.resolve(node);
        }
        return this.asyncLoadXML(url).then(doc => {
            return doc.children[0];
        });
    }
    loadGame(url)
    {
        return this.asyncLoadXML(url).then(doc => {
            const node = doc.querySelector('game');
            const parser = new Engine.Loader.XML.GameParser(this, node);
            return parser.parse();
        });
    }
    loadScene(url)
    {
        return this.asyncLoadXML(url).then(doc => {
            const sceneNode = doc.querySelector('scene');
            return this.parseScene(sceneNode);
        });
    }
    loadSceneByName(name)
    {
        if (!this.sceneIndex[name]) {
            throw new Error(`Scene "${name}" does not exist.`);
        }

        return this.loadScene(this.sceneIndex[name].url);
    }
    parseScene(node)
    {
        if (node.tagName !== 'scene') {
            throw new TypeError('Node not <scene>');
        }

        const type = node.getAttribute('type');
        if (type) {
            if (type === 'level') {
                const parser = new Engine.Loader.XML.LevelParser(this, node);
                return parser.getScene();
            } else if (type === 'stage-select') {
                const parser = new Engine.Loader.XML.StageSelectParser(this, node);
                return parser.getScene();
            } else {
                throw new Error(`Scene type "${type}" not recognized`);
            }
        } else {
            const parser = new Engine.Loader.XML.SceneParser(this, node);
            return parser.getScene();
        }
    }
    resolveURL(node, attr)
    {
        const url = node.getAttribute(attr || 'url');
        if (!url) {
            return null;
        }

        if (node.ownerDocument.baseURL === undefined) {
            return url;
        }
        if (url.indexOf('http') === 0) {
            return url;
        }
        const baseUrl = node.ownerDocument.baseURL
            .split('/').slice(0, -1).join('/') + '/';

        return baseUrl + url;
    }
}

'use strict';

Engine.Loader.XML.Parser =
class Parser
{
    constructor(loader)
    {
        this.loader = loader;
        this.DEFAULT_UV = [
            new THREE.Vector2(),
            new THREE.Vector2(),
            new THREE.Vector2(),
        ];
    }
    createObject(name, ext, func)
    {
        const fnName = name.replace(/-/g, '');
        const object = Engine.Util.renameFunction(fnName, func);
        Engine.Util.extend(object, ext);
        return object;
    }
    getArray(nodes, attr)
    {
        const values = [];
        for (let node, i = 0; node = nodes[i++];) {
            values.push(node.getAttribute(attr));
        }
        return values;
    }
    getAttr(node, name)
    {
        const val = node.getAttribute(name);
        if (val === null || val.length === 0) {
            return null;
        } else {
            return val;
        }
    }
    getAudio(audioNode)
    {
        const url = this.resolveURL(audioNode, 'src');
        if (!url) {
            const id = this.getAttr(audioNode, 'id');
            const audio = this.loader.resourceManager.get('audio', id);
            return Promise.resolve(audio);
        }

        return this.loader.resourceLoader.loadAudio(url)
            .then(audio => {
                const loopNode = audioNode.getElementsByTagName('loop')[0];
                if (loopNode) {
                    audio.setLoop(this.getFloat(loopNode, 'start') || 0,
                                  this.getFloat(loopNode, 'end') || audio.getBuffer().duration);
                }
                return audio;
            });
    }
    getBool(node, attr)
    {
        return node.getAttribute(attr) === 'true';
    }
    getCameraPath(pathNode)
    {
        const z = 150;
        const path = new Engine.Camera.Path();
        /* y1 and y2 is swapped because they are converted to negative values and
           y2 should always be bigger than y1. */
        const windowNode = pathNode.getElementsByTagName('window')[0];
        path.window[0] = this.getPosition(windowNode, 'x1', 'y1');
        path.window[1] = this.getPosition(windowNode, 'x2', 'y2');

        const constraintNode = pathNode.getElementsByTagName('constraint')[0];
        path.constraint[0] = this.getPosition(constraintNode, 'x1', 'y1', 'z');
        path.constraint[1] = this.getPosition(constraintNode, 'x2', 'y2', 'z');
        path.constraint[0].z = z;
        path.constraint[1].z = z;

        return path;
    }
    getColor(node, attr = 'color')
    {
        const val = node.getAttribute(attr);
        if (val) {
            const [r, g, b] = val.split(',').map(v => parseFloat(v));
            return new THREE.Color(r || 1, g || 1, b || 1);
        }
        return null;
    }
    getColorHex(node, attr = 'color')
    {
        const val = node.getAttribute(attr);
        if (val && val[0] === '#') {
            const [r, g, b] = [
                parseInt(val.substr(1, 2), 16),
                parseInt(val.substr(3, 2), 16),
                parseInt(val.substr(5, 2), 16),
            ];
            return new THREE.Vector3(r, g, b);
        }
        return null;
    }
    getFloat(node, attr)
    {
        const value = node.getAttribute(attr);
        if (value) {
            return parseFloat(value);
        }
        return null;
    }
    getGeometry(node)
    {
        const type = node.getAttribute('type');
        let geo;
        if (type === 'plane') {
            geo = new THREE.PlaneGeometry(
                parseFloat(node.getAttribute('w')),
                parseFloat(node.getAttribute('h')),
                parseFloat(node.getAttribute('w-segments')) || 1,
                parseFloat(node.getAttribute('h-segments')) || 1);
        } else {
            throw new Error('Could not parse geometry type "' + type + '"');
        }

        const uvs = geo.faceVertexUvs[0];
        for (let i = 0, l = uvs.length; i !== l; ++i) {
            uvs[i] = this.DEFAULT_UV;
        }

        return geo;
    }
    getInt(node, attr)
    {
        const value = node.getAttribute(attr);
        if (value) {
            return parseInt(value, 10);
        }
        return null;
    }
    getRange(node, attr, total)
    {
        const input = node.getAttribute(attr || 'range');

        const values = [];
        let groups, group, ranges, range, mod, upper, lower, comp;

        groups = input.split(',');

        while (group = groups.shift()) {
            comp = group.split('/');
            mod = comp[1] ? parseInt(comp[1], 10) : 1;
            ranges = comp[0].split('-');

            if (ranges.length === 2) {
                lower = parseInt(ranges[0], 10);
                upper = parseInt(ranges[1], 10);
            }
            else if (ranges[0] === '*') {
                lower = 1;
                upper = total;
            }
            else {
                lower = parseInt(ranges[0], 10);
                upper = lower;
            }

            if (lower > upper) {
                throw new RangeError("Lower range greater then upper");
            }
            if (upper > total) {
                throw new RangeError("Upper range beyond " + total);
            }

            let i = 0;
            while (lower <= upper) {
                if (i++ % mod === 0) {
                    values.push(lower);
                }
                ++lower;
            }
        }

        return values;
    }
    getRect(node, attrX, attrY, attrW, attrH)
    {
        return {
            'x': this.getFloat(node, attrX || 'x') || 0,
            'y': this.getFloat(node, attrY || 'y') || 0,
            'w': this.getFloat(node, attrW || 'w'),
            'h': this.getFloat(node, attrH || 'h'),
        }
    }
    getPosition(node, attrX, attrY, attrZ)
    {
        const vec3 = this.getVector3.apply(this, arguments);
        return vec3;
    }
    getTexture(textureNode)
    {
        if (textureNode.tagName !== 'texture') {
            throw new Error("Node not <texture>");
        }

        const textureScale = this.getFloat(textureNode, 'scale') || this.loader.textureScale;
        const textureUrl = this.resolveURL(textureNode, 'url');
        const textureId = textureNode.getAttribute('id');

        const texture = new THREE.Texture();
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipMapLinearFilter;

        function createReplace(colorIn, colorOut) {
            return function colorReplace(canvas) {
                return Engine.CanvasUtil.colorReplace(canvas,
                    colorIn, colorOut);
            }
        }

        this.loader.resourceLoader.loadImage(textureUrl).then(canvas => {
            texture.name = textureId;
            const effects = [];
            const effectsNode = textureNode.getElementsByTagName('effects')[0];
            if (effectsNode) {
                const effectNodes = effectsNode.getElementsByTagName('*');
                for (let effectNode, i = 0; effectNode = effectNodes[i++];) {
                    if (effectNode.tagName === 'color-replace') {
                        const colors = [
                            this.getColorHex(effectNode, 'in'),
                            this.getColorHex(effectNode, 'out'),
                        ];
                        effects.push(createReplace(colors[0], colors[1]));
                    }
                }
            }

            if (textureScale !== 1) {
                effects.push(function(canvas) {
                    return Engine.CanvasUtil.scale(canvas, textureScale);
                });
            }

            effects.forEach(effect => {
                canvas = effect(canvas);
            });
            texture.image = canvas;
            texture.needsUpdate = true;
        });

        return texture;
    }
    getVector2(node, attrX, attrY)
    {
        const x = this.getAttr(node, attrX || 'x');
        const y = this.getAttr(node, attrY || 'y');
        if (x === null || y === null) {
            return null;
        }
        return new THREE.Vector2(parseFloat(x),
                                 parseFloat(y));
    }
    getVector3(node, attrX, attrY, attrZ)
    {
        if (arguments.length == 2) {
            const aggr = this.getAttr(node, attrX).split(',');
            const vec = new THREE.Vector3();
            vec.x = aggr[0] ? parseFloat(aggr[0]) : undefined;
            vec.y = aggr[1] ? parseFloat(aggr[1]) : undefined;
            vec.z = aggr[2] ? parseFloat(aggr[2]) : undefined;
            return vec;
        } else {
            const x = this.getAttr(node, attrX || 'x');
            const y = this.getAttr(node, attrY || 'y');
            const z = this.getAttr(node, attrZ || 'z');
            if (x === null || y === null) {
                return null;
            }
            return new THREE.Vector3(parseFloat(x),
                                     parseFloat(y),
                                     parseFloat(z));
        }
    }
    resolveURL(node, attr)
    {
        const url = this.getAttr(node, attr || 'url');
        if (!url) {
            return false;
        }
        if (node.ownerDocument.baseURL === undefined) {
            return url;
        }
        if (url.indexOf('http') === 0) {
            return url;
        }
        const baseUrl = node.ownerDocument.baseURL
                             .split('/')
                             .slice(0, -1)
                             .join('/') + '/';
        return baseUrl + url;
    }
}

'use strict';

Engine.Loader.XML.ActionParser =
class ActionParser
extends Engine.Loader.XML.Parser
{
    constructor()
    {
        super();

        this.DEGTORAD = Math.PI / 180;
    }
    getAction(node)
    {
        const conditionNodes = node.querySelectorAll(':scope > condition');
        const conditions = [];
        for (let conditionNode, j = 0; conditionNode = conditionNodes[j++];) {
            const values = this.getAttr(conditionNode, 'value')
                               .split('|')
                               .map(value => parseFloat(value) || value);
            conditions.push(values);
        }

        const callback = this._resolveFunction(node);

        if (conditions.length > 0) {
            const wrapper = function() {
                for (let i = 0; i < conditions.length; ++i) {
                    if (conditions[i].indexOf(arguments[i]) === -1) {
                        return;
                    }
                }
                callback.apply(this, arguments);
            };
            return wrapper;
        }

        return callback;
    }
    getEasing(node, attr)
    {
        const aggr = this.getAttr(node, attr);
        if (aggr) {
            const comp = aggr.split(',');
            const name = comp.shift();
            if (comp.length) {
                const val = parseFloat(comp[0]);
                return Engine.Easing[name](val);
            } else {
                return Engine.Easing[name]();
            }
        } else {
            return Engine.Easing.linear();
        }
    }
    _parseActionCameraMove(node)
    {
        const to = this.getVector3(node, 'to');
        const tweenNode = node.querySelector(':scope > tween');
        if (tweenNode) {
            const duration = this.getFloat(tweenNode, 'duration');
            const easing = this.getEasing(tweenNode, 'easing');
            return function cameraPanTo() {
                return this.camera.panTo(to, duration, easing);
            }
        } else {
            return function cameraJumpTo() {
                this.camera.position.copy(to);
            };
        }
    }
    _parseActionTransform(node)
    {
        const operations = [];
        const transNodes = node.querySelectorAll('opacity, position, rotation, scale');
        for (let node, i = 0; node = transNodes[i]; ++i) {
            const operation = this._parseTransformation(node);
            operations.push(operation);
        }

        const ids = [];
        const objectNodes = node.querySelectorAll('object');
        for (let node, i = 0; node = objectNodes[i]; ++i) {
            const id = this.getAttr(node, 'instance');
            ids.push(id);
        }

        return function transform() {
            const world = this.world;
            const tasks = [];
            ids.forEach(id => {
                const object = world.getObject(id);
                if (!object) {
                    throw new Error(`Object instance "${id}" not defined`);
                }
                operations.forEach(operation => {
                    const task = operation(object);
                    tasks.push(task);
                });
            });
            return Engine.SyncPromise.all(tasks);
        };
    }
    _parseTransformation(node)
    {
        let duration = 0;
        let easing;
        if (node.parentNode.tagName === 'tween') {
            duration = this.getFloat(node.parentNode, 'duration') || 0;
            easing = this.getEasing(node.parentNode, 'easing');
        }

        const type = node.tagName;
        if (type === 'opacity') {
            const to = this.getFloat(node, 'to');
            return function opacityTransform(object) {
                const tween = new Engine.Tween({opacity: to}, easing);
                tween.addSubject(object.model.material);
                return object.doFor(duration, (elapsed, progress) => {
                    tween.update(progress);
                });
            };
        } else if (type === 'position') {
            const to = this.getVector3(node, 'to');
            return function positionTransform(object) {
                const tween = new Engine.Tween(to, easing);
                tween.addSubject(object.position);
                return object.doFor(duration, (elapsed, progress) => {
                    tween.update(progress);
                });
            };
        } else if (type === 'rotation') {
            const to = this.getVector3(node, 'to');
            Object.keys(to).forEach(key => {
                if (to[key]) {
                    to[key] *= this.DEGTORAD;
                }
            });
            return function rotationTransform(object) {
                const tween = new Engine.Tween(to, easing);
                tween.addSubject(object.model.rotation);
                return object.doFor(duration, (elapsed, progress) => {
                    tween.update(progress);
                });
            };
        } else if (type === 'scale') {
            const to = this.getFloat(node, 'to');
            const vec = new THREE.Vector3(to, to, to);
            return function scaleTransform(object) {
                const tween = new Engine.Tween(to, easing);
                tween.addSubject(object.model.scale);
            };
        }
    }
    _resolveFunction(node)
    {
        const type = this.getAttr(node, 'type');

        if (type === 'camera-move') {
            return this._parseActionCameraMove(node);
        } else if (type === 'emit-audio') {
            const id = this.getAttr(node, 'id');
            return function emitAudio() {
                this.emitAudio(this.audio[id]);
            };
        } else if (type === 'emit-event') {
            const name = this.getAttr(node, 'name');
            return function emitEvent() {
                this.events.trigger(name, []);
            };
        } else if (type === 'play-audio') {
            const id = this.getAttr(node, 'id');
            return function playAudio() {
                this.audio.play(id);
            };
        } else if (type === 'stop-audio') {
            const id = this.getAttr(node, 'id');
            return function stopAudio() {
                this.audio.stop(id);
            };
        } else if (type === 'play-sequence') {
            const id = this.getAttr(node, 'id');
            return function playSequence() {
                return this.sequencer.playSequence(id);
            };
        } else if (type === 'set-animation') {
            const id = this.getAttr(node, 'id');
            return function setAnimation() {
                this.setAnimation(id);
            };
        } else if (type === 'transform') {
            return this._parseActionTransform(node);
        } else if (type === 'wait') {
            const duration = this.getFloat(node, 'duration') || 0;
            return function wait() {
                return this.waitFor(duration);
            };
        }

        throw new Error(`No action "${type}"`);
    }
}

'use strict';

Engine.Loader.XML.EventParser =
class EventParser
extends Engine.Loader.XML.Parser
{
    constructor(loader, node)
    {
        if (node.tagName !== 'events') {
            throw new TypeError('Node not <events>');
        }

        super(loader);
        this._node = node;
        this._events = null;
    }
    getEvents()
    {
        if (!this._events) {
            this._events = this._parseEvents()
        }
        return Promise.resolve(this._events);
    }
    _parseEvents()
    {
        const events = [];
        const parser = new Engine.Loader.XML.ActionParser;
        const actionNodes = this._node.querySelectorAll(':scope > event > action');
        for (let actionNode, i = 0; actionNode = actionNodes[i++];) {
            const name = this.getAttr(actionNode.parentNode, 'name');
            const action = parser.getAction(actionNode);
            events.push({
                name: name,
                callback: action,
            });
        }
        return events;
    }
}

'use strict';

Engine.Loader.XML.GameParser =
class GameParser
extends Engine.Loader.XML.Parser
{
    constructor(loader, node)
    {
        if (!node || node.tagName !== 'game') {
            throw new TypeError('Node not <game>');
        }

        super(loader);

        this._node = node;
    }
    parse()
    {
        const characterNodes = this._node
            .querySelectorAll(':scope > characters > objects');

        const itemNodes = this._node
            .querySelectorAll(':scope > items > objects');

        const projectileNodes = this._node
            .querySelectorAll(':scope > projectiles > objects');

        return this._parseConfig().then(() => {
            return Promise.all([
                this._parseAudio(),
                this._parseFonts(),
            ]);
        }).then(() => {
            return this._parseObjects(itemNodes);
        }).then(() => {
            return Promise.all([
                this._parseEntrypoint(),
                this._parseObjects(characterNodes),
                this._parseObjects(projectileNodes),
                this._parseScenes(),
            ]);
        }).then(() => {
            return this._parsePlayer();
        }).then(() => {
            return this._parseWeapons();
        }).then(() => {
            return this.loader.entrypoint;
        });
    }
    _parseAudio()
    {
        const audioNodes = this._node.querySelectorAll('audio > *');
        const tasks = [];
        for (let audioNode, i = 0; audioNode = audioNodes[i++];) {
            const task = this.getAudio(audioNode)
                .then(audio => {
                    const id = this.getAttr(audioNode, 'id');
                    this.loader.resourceManager.addAudio(id, audio);
                });
            tasks.push(task);
        }
        return Promise.all(tasks);
    }
    _parseConfig()
    {
        const configNode = this._node.querySelector(':scope > config');
        const textureScale = this.getInt(configNode, 'texture-scale');
        if (textureScale) {
            this.loader.textureScale = textureScale;
        }
        return Promise.resolve();
    }
    _parseEntrypoint()
    {
        const entrypoint= this._node.querySelector(':scope > entrypoint');
        if (entrypoint) {
            this.loader.entrypoint = entrypoint.getAttribute('scene');
        }
        return Promise.resolve();
    }
    _parseFonts()
    {
        const nodes = this._node.querySelectorAll(':scope > fonts > font');
        const tasks = [];
        const loader = this.loader;
        for (let node, i = 0; node = nodes[i++];) {
            const url = this.resolveURL(node, 'url');
            const task = loader.resourceLoader.loadImage(url).then(canvas => {
                const fontId = this.getAttr(node, 'id');
                const size = this.getVector2(node, 'w', 'h');
                const map = node.getElementsByTagName('map')[0].textContent;
                const font = new Engine.BitmapFont(map, size, canvas);
                font.scale = loader.textureScale;
                loader.resourceManager.addFont(fontId, function(text) {
                    return font.createText(text);
                });
            });
            tasks.push(task);
        }
        return Promise.all(tasks);
    }
    _parseObjects(nodes)
    {
        const tasks = [];
        const resource = this.loader.resourceManager;
        for (let node, i = 0; node = nodes[i++];) {
            const task = this.loader.followNode(node)
                .then(node => {
                    const parser = new Engine.Loader.XML.ObjectParser(this.loader, node);
                    return parser.getObjects();
                })
                .then(objects => {
                    Object.keys(objects).forEach(id => {
                        const object = objects[id];
                        resource.addAuto(id, object.constructor);
                    });
                });
            tasks.push(task);
        }
        return Promise.all(tasks);
    }
    _parsePlayer()
    {
        const playerNode = this._node.querySelector('player');
        const player = this.loader.game.player;
        const characterId = playerNode.querySelector('character')
                                      .getAttribute('id');

        player.defaultWeapon = playerNode.querySelector('weapon')
                                         .getAttribute('default');

        const Character = this.loader.resourceManager.get('object', characterId);
        const character = new Character;

        const invincibilityNode = playerNode.querySelector('invincibility');

        player.retries = this.getInt(playerNode, 'retries') || 3;
        player.setCharacter(character);

        return Promise.resolve();
    }
    _parseScenes()
    {
        const nodes = this._node.querySelectorAll(':scope > scenes > scene');
        const index = this.loader.sceneIndex;
        for (let node, i = 0; node = nodes[i++];) {
            const name = this.getAttr(node, 'name');
            index[name] = {
                'url': this.loader.resolveURL(node, 'src'),
            };
        }
        return Promise.resolve();
    }
    _parseWeapons()
    {
        const weaponsNode = this._node.querySelector(':scope > weapons');
        if (weaponsNode) {
            const resource = this.loader.resourceManager;
            const weaponParser = new Engine.Loader.XML.WeaponParser(this.loader);
            const weapons = weaponParser.parse(weaponsNode);
            const player = this.loader.game.player;
            Object.keys(weapons).forEach((key) => {
                resource.addAuto(key, weapons[key]);
                const weaponInstance = new weapons[key];
                player.weapons[weaponInstance.code] = weaponInstance;
            });
        }
    }
}

'use strict';

Engine.Loader.XML.ObjectParser =
class ObjectParser
extends Engine.Loader.XML.Parser
{
    constructor(loader, node)
    {
        if (!node || node.tagName !== 'objects') {
            throw new TypeError('Node not <objects>');
        }

        super(loader);

        this._node = node;

        this._animations = null;
        this._textures = null;
    }
    getObjects()
    {
        if (!this._promise) {
            this._promise =  this._parse();
        }
        return this._promise;
    }
    _createConstructor(blueprint)
    {
        if (!blueprint.textures['__default']) {
            console.warn('No default texture on blueprint', blueprint);
            //throw new Error('No default texture on blueprint');
        }

        const constructor = this.createObject(blueprint.id, blueprint.constructor, function objectConstructor() {
            if (blueprint.geometries.length) {
                this.geometry = blueprint.geometries[0].clone();
                this.material = new THREE.MeshPhongMaterial({
                    depthWrite: false,
                    map: this.textures['__default'] && this.textures['__default'].texture,
                    side: THREE.DoubleSide,
                    transparent: true,
                });
            }

            blueprint.constructor.call(this);

            this.name = blueprint.id;

            blueprint.traits.forEach(Trait => {
                this.applyTrait(new Trait);
            });

            /* Run initial update of all UV maps. */
            blueprint.animators.forEach(anim => {
                const animator = anim.clone();
                animator.addGeometry(this.geometry);
                animator.update();
                this.animators.push(animator);
            });

            blueprint.collision.forEach(coll => {
                if (coll.r) {
                    this.addCollisionZone(coll.r, coll.x, coll.y);
                } else {
                    this.addCollisionRect(coll.w, coll.h, coll.x, coll.y);
                }
            });

            blueprint.events.forEach(event => {
                this.events.bind(event.name, event.callback);
            });

            blueprint.sequences.forEach(seq => {
                this.sequencer.addSequence(seq.id, seq.sequence);
            });
        });

        constructor.prototype.animations = blueprint.animations;
        constructor.prototype.audio = blueprint.audio;
        constructor.prototype.textures = blueprint.textures;

        if (blueprint.animationRouter !== undefined) {
            constructor.prototype.routeAnimation = blueprint.animationRouter;
        }

        return constructor;
    }
    _faceCoordsToIndex(coords, segs)
    {
        let i, j, x, y, faceIndex, indices = [];
        for (i in coords.x) {
            x = coords.x[i] - 1;
            for (j in coords.y) {
                y = coords.y[j] - 1;
                /* The face index is the first of the two triangles that make up a rectangular
                   face. The Animator.UV will set the UV map to the faceIndex and faceIndex+1.
                   Since we expect to paint two triangles at every index we need to 2x the index
                   count so that we skip two faces for every index jump. */
                faceIndex = (x + (y * segs.x)) * 2;
                indices.push(faceIndex);
            }
        }
        return indices;
    }
    _getConstructor(type, source)
    {
        if (type === 'character' && Engine.objects.characters[source]) {
            return Engine.objects.characters[source];
        } else {
            return Engine.Object;
        }
    }
    _getTexture(id)
    {
        if (id) {
            if (this._textures[id]) {
                return this._textures[id];
            } else {
                console.log(this._textures);
                throw new Error('Texture "' + id + '" not defined');
            }
        } else if (this._textures['__default']) {
            return this._textures['__default'];
        } else {
            throw new Error('Default texture not defined');
        }
    }
    _parse()
    {
        return this._parseTextures().then(textures => {
            this._textures = textures;
            return this._parseAnimations();
        }).then(animations => {
            this._animations = animations;
            return this._parseObjects();
        });
    }
    _parseAnimations()
    {
        const nodes = this._node.querySelectorAll(':scope > animations > animation');

        const animations = {
            __default: undefined,
        };

        for (let i = 0, node; node = nodes[i++];) {
            const animation = this._parseAnimation(node);
            animations[animation.id || '__default'] = animation;
            if (animations['__default'] === undefined) {
                animations['__default'] = animation;
            }
        }

        return Promise.resolve(animations);
    }
    _parseAnimation(animationNode)
    {
        const textureId = animationNode.parentNode.getAttribute('texture');
        const texture = this._getTexture(textureId);

        const id = animationNode.getAttribute('id');
        const group = animationNode.getAttribute('group') || undefined;
        const animation = new Engine.Animator.Animation(id, group);
        const frameNodes = animationNode.getElementsByTagName('frame');
        let loop = [];
        for (let i = 0, frameNode; frameNode = frameNodes[i++];) {
            const offset = this.getVector2(frameNode, 'x', 'y');
            const size = this.getVector2(frameNode, 'w', 'h') ||
                         this.getVector2(frameNode.parentNode, 'w', 'h') ||
                         this.getVector2(frameNode.parentNode.parentNode, 'w', 'h');
            const uvMap = new Engine.UVCoords(offset, size, texture.size);
            const duration = this.getFloat(frameNode, 'duration') || undefined;
            animation.addFrame(uvMap, duration);

            const parent = frameNode.parentNode;
            if (parent.tagName === 'loop') {
                loop.push([uvMap, duration]);
                const next = frameNodes[i+1] && frameNodes[i+1].parentNode;
                if (parent !== next) {
                    let loopCount = parseInt(parent.getAttribute('count'), 10) || 1;
                    while (--loopCount) {
                        for (let j = 0; j < loop.length; ++j) {
                            animation.addFrame(loop[j][0], loop[j][1]);
                        }
                    }
                    loop = [];
                }
            }
        }

        return animation;
    }
    _parseFace(faceNode)
    {
        const indices = [];
        const segs = this.getVector2(faceNode.parentNode, 'w-segments', 'h-segments')
                   || new THREE.Vector2(1, 1);

        const rangeNodes = faceNode.getElementsByTagName('range');
        for (let rangeNode, i = 0; rangeNode = rangeNodes[i]; ++i) {
            const coords = {
                'x': this.getRange(rangeNode, 'x', segs.x),
                'y': this.getRange(rangeNode, 'y', segs.y),
            };
            const rangeIndices = this._faceCoordsToIndex(coords, segs);
            Array.prototype.push.apply(indices, rangeIndices);
        }

        const indexJSON = faceNode.getAttribute('index');
        if (indexJSON) {
            const jsonIndices = JSON.parse(indexJSON);
            Array.prototype.push.apply(indices, jsonIndices);
        }

        return indices;
    }
    _parseObjects()
    {
        const objectNodes = this._node.querySelectorAll(':scope > object');

        const tasks = [];
        const objects = {};
        for (let i = 0, node; node = objectNodes[i++];) {
            const id = node.getAttribute('id');
            if (objects[id]) {
                console.error(node);
                throw new Error('Object id ' + id + ' already defined');
            }
            const task = this._parseObject(node).then(blueprint => {
                return this._createConstructor(blueprint);
            }).then(constructor => {
                objects[id] = {
                    node: node,
                    constructor: constructor,
                };
            });
            tasks.push(task);
        }
        return Promise.all(tasks).then(() => {
            return objects;
        });
    }
    _parseObject(objectNode)
    {
        const type = objectNode.getAttribute('type');
        const source = objectNode.getAttribute('source');

        const constructor = this._getConstructor(type, source);
        const objectId = objectNode.getAttribute('id');

        const animations = this._animations;
        const textures = this._textures;

        const blueprint = {
            id: objectId,
            constructor: constructor,
            audio: null,
            animations: animations,
            animators: [],
            events: null,
            geometries: [],
            sequences: null,
            textures: textures,
            traits: null,
        };

        const geometryNodes = objectNode.getElementsByTagName('geometry');
        const textNodes = objectNode.getElementsByTagName('text');
        if (geometryNodes.length) {
            for (let i = 0, geometryNode; geometryNode = geometryNodes[i]; ++i) {
                const geometry = this.getGeometry(geometryNode);
                blueprint.geometries.push(geometry);

                const faceNodes = geometryNode.getElementsByTagName('face');
                for (let j = 0, faceNode; faceNode = faceNodes[j]; ++j) {
                    const animator = new Engine.Animator.UV();
                    animator.indices = [];
                    animator.offset = this.getFloat(faceNode, 'offset') || 0;

                    animator.name = faceNode.getAttribute('animation');
                    if (!animator.name) {
                        throw new Error("No default animation defined");
                    }
                    if (!animations[animator.name]) {
                        throw new Error("Animation " + animator.name + " not defined");
                    }
                    const animation = animations[animator.name];

                    animator.setAnimation(animation);

                    animator.indices = this._parseFace(faceNode);

                    if (animator.indices.length === 0) {
                        animator.indices = [j * 2];
                    }

                    animator.indices.sort(function(a, b) {
                        return a - b;
                    });

                    blueprint.animators.push(animator);
                }

                if (!blueprint.animators.length && animations['__default']) {
                    const animator = new Engine.Animator.UV();
                    animator.setAnimation(animations['__default']);
                    animator.update();
                    blueprint.animators.push(animator);
                }
            }
        } else if (textNodes.length) {
            const node = textNodes[0];
            const font = node.getAttribute('font');
            const string = node.textContent;
            const text = this.loader.resourceManager.get('font', font)(string);
            blueprint.geometries.push(text.getGeometry());
            blueprint.textures = {__default: {texture: text.getTexture()}};
        }

        return Promise.all([
            this._parseObjectAnimationRouter(objectNode).then(router => {
                if (router) {
                    blueprint.animationRouter = router;
                }
            }),
            this._parseObjectCollision(objectNode).then(collision => {
                blueprint.collision = collision;
            }),
            this._parseObjectAudio(objectNode).then(audio => {
                blueprint.audio = audio;
            }),
            this._parseObjectEvents(objectNode).then(events => {
                blueprint.events = events;
            }),
            this._parseObjectTraits(objectNode).then(traits => {
                blueprint.traits = traits;
            }),
            this._parseObjectSequences(objectNode).then(sequences => {
                blueprint.sequences = sequences;
            }),
        ]).then(() => {
            return blueprint;
        });
    }
    _parseObjectAnimationRouter(objectNode)
    {
        const node = objectNode.getElementsByTagName('animation-router')[0];
        if (node) {
            let animationRouter;
            eval(node.textContent);
            if (typeof animationRouter === "function") {
                return Promise.resolve(animationRouter);
            }
        }
        return Promise.resolve(null);
    }
    _parseObjectAudio(objectNode)
    {
        const tasks = [];
        const audioDef = {};
        const audioNodes = objectNode.querySelectorAll('audio > *');
        for (let audioNode, i = 0; audioNode = audioNodes[i++];) {
            const task = this.getAudio(audioNode)
                .then(audio => {
                    const id = this.getAttr(audioNode, 'id');
                    audioDef[id] = audio;
                });
            tasks.push(task);
        }
        return Promise.all(tasks).then(() => {
            return audioDef;
        });
    }
    _parseObjectCollision(objectNode)
    {
        const collisionZones = [];
        const collisionNode = objectNode.getElementsByTagName('collision')[0];
        if (collisionNode) {
            const collNodes = collisionNode.getElementsByTagName('*');
            for (let collNode, i = 0; collNode = collNodes[i++];) {
                const type = collNode.tagName;
                if (type === 'rect') {
                    collisionZones.push(this.getRect(collNode));
                } else if (type === 'circ') {
                    collisionZones.push({
                        x: this.getFloat(collNode, 'x') || 0,
                        y: this.getFloat(collNode, 'y') || 0,
                        r: this.getFloat(collNode, 'r'),
                    });
                } else {
                    throw new TypeError('No collision type "' + type + '"');
                }
            }
        }
        return Promise.resolve(collisionZones);
    }
    _parseObjectEvents(objectNode)
    {
        const eventsNode = objectNode.querySelector(':scope > events');
        if (eventsNode) {
            const parser = new Engine.Loader.XML.EventParser(this.loader, eventsNode);
            return parser.getEvents();
        }
        else {
            return Promise.resolve([]);
        }
    }
    _parseObjectTraits(objectNode)
    {
        const traits = [];
        const traitParser = new Engine.Loader.XML.TraitParser(this.loader);
        const traitsNode = objectNode.getElementsByTagName('traits')[0];
        if (traitsNode) {
            const traitNodes = traitsNode.getElementsByTagName('trait');
            for (let traitNode, i = 0; traitNode = traitNodes[i++];) {
                traits.push(traitParser.parseTrait(traitNode));
            }
        }
        return Promise.resolve(traits);
    }
    _parseObjectSequences(objectNode)
    {
        const parser = new Engine.Loader.XML.SequenceParser;
        const node = objectNode.querySelector(':scope > sequences');
        if (node) {
            const sequences = parser.getSequences(node);
            return Promise.resolve(sequences);
        } else {
            return Promise.resolve([]);
        }
    }
    _parseTextures()
    {
        const nodes = this._node.querySelectorAll(':scope > textures > texture');
        const textures = {
            __default: undefined,
        };
        for (let node, i = 0; node = nodes[i++];) {
            const textureId = node.getAttribute('id') || '__default';
            textures[textureId] = {
                id: textureId,
                texture: this.getTexture(node),
                size: this.getVector2(node, 'w', 'h'),
            };
            if (textures['__default'] === undefined) {
                textures['__default'] = textures[textureId];
            }
        }
        return Promise.resolve(textures);
    }
}

'use strict';

Engine.Loader.XML.SequenceParser =
class SequenceParser extends Engine.Loader.XML.Parser
{
    getSequences(sequencesNode)
    {
        const sequences = [];
        const nodes = sequencesNode.querySelectorAll(':scope > sequence');
        for (let node, i = 0; node = nodes[i]; ++i) {
            const id = this.getAttr(node, 'id');
            const sequence = this.getSequence(node);
            sequences.push({
                id,
                sequence,
            });
        }
        return sequences;
    }
    getSequence(sequenceNode)
    {
        const actionParser = new Engine.Loader.XML.ActionParser;
        const nodes = sequenceNode.querySelectorAll('action');
        const sequence = [];
        for (let node, i = 0; node = nodes[i]; ++i) {
            const action = actionParser.getAction(node);
            sequence.push([action]);
        }
        return sequence;
    }
}

'use strict';

Engine.Loader.XML.TraitParser =
class TraitParser
extends Engine.Loader.XML.Parser
{
    constructor(loader)
    {
        super(loader);
        this.TRAIT_MAP = {
            'attach': 'Attach',
            'climbable': 'Climbable',
            'climber': 'Climber',
            'contact-damage': 'ContactDamage',
            'conveyor': 'Conveyor',
            'death-spawn': 'DeathSpawn',
            'death-zone': 'DeathZone',
            'destructible': 'Destructible',
            'disappearing': 'Disappearing',
            'door': 'Door',
            'elevator': 'Elevator',
            'emittable': 'Emittable',
            'environment': 'Environment',
            'fallaway': 'Fallaway',
            'fixed-force': 'FixedForce',
            'glow': 'Glow',
            'headlight': 'Headlight',
            'health': 'Health',
            'invincibility': 'Invincibility',
            'jump': 'Jump',
            'lifetime': 'Lifetime',
            'light': 'Light',
            'light-control': 'LightControl',
            'move': 'Move',
            'physics': 'Physics',
            'pickupable': 'Pickupable',
            'projectile': 'Projectile',
            'rotate': 'Rotate',
            'solid': 'Solid',
            'spawn': 'Spawn',
            'stun': 'Stun',
            'teleport': 'Teleport',
            'translate': 'Translate',
            'translating': 'Translating',
            'weapon': 'Weapon',
        };
    }
    createConstructor(blueprint)
    {
        const constructor = this.createObject(blueprint.name, blueprint.constr, function blueprintConstructor() {
            const trait = new blueprint.constr;
            blueprint.setup(trait);
            return trait;
        });
        return constructor;
    }
    getConstructor(name)
    {
        const type = this.TRAIT_MAP[name];
        if (!type || !Engine.traits[type]) {
            throw new TypeError(`Trait type "${name}"" does not exist`);
        }
        return Engine.traits[type];
    }
    getSetup(node)
    {
        const name = this.getAttr(node, 'name');
        if (name === 'destructible') {
            const affectorObjectNodes = node.querySelectorAll(':scope > affectors > object');
            const ids = this.getArray(affectorObjectNodes, 'id');
            return function setup(trait) {
                ids.forEach(id => {
                    trait.affectors.add(id);
                });
            };
        } else if (name === 'door') {
            const directionNode = node.getElementsByTagName('direction')[0];
            let direction;
            if (directionNode) {
                direction = this.getVector2(directionNode);
            }
            const oneWay = this.getBool(node, 'one-way');
            return function setup(trait) {
                if (direction) {
                    trait.direction = direction;
                }
                trait.oneWay = oneWay;
            };
        } else if (name === 'elevator') {
            const nodes = [];
            let speed = 0;
            const pathNode = node.getElementsByTagName('path')[0];
            if (pathNode) {
                speed = this.getFloat(pathNode, 'speed');
                const nodeNodes = pathNode.getElementsByTagName('node');
                if (nodeNodes) {
                    for (let nodeNode, i = 0; nodeNode = nodeNodes[i++];) {
                        const node = this.getVector2(nodeNode);
                        nodes.push(node);
                    }
                }
            }
            return function setup(trait) {
                trait.speed = speed;
                nodes.forEach(function(node) {
                    trait.addNode(node);
                });
            };
        } else if (name === 'fixed-force') {
            const vec = new THREE.Vector2;
            vec.x = this.getFloat(node, 'x') || 0;
            vec.y = this.getFloat(node, 'y') || 0;
            return function setup(trait) {
                trait.force.copy(vec);
            };
        } else if (name === 'jump') {
            const duration = this.getFloat(node, 'duration');
            const force = new THREE.Vector2();
            force.x = this.getFloat(node, 'forward') || 0;
            force.y = this.getFloat(node, 'force') || 0;
            return function setup(trait) {
                if (duration) {
                    trait.duration = duration;
                }
                trait.force.copy(force);
            };
        } else if (name === 'light-control') {
            const color = this.getColor(node);
            return function setup(trait) {
                trait.color.copy(color);
            };
        } else if (name === 'health') {
            const max = this.getFloat(node, 'max');
            return function setup(trait) {
                trait.energy.max = max;
            };
        } else if (name === 'pickupable') {
            const props = {};
            const propNodes = node.getElementsByTagName('property');
            for (let propNode, i = 0; propNode = propNodes[i]; ++i) {
                const key = propNode.attributes[0].name;
                const value = propNode.attributes[0].value;
                props[key] = parseFloat(value) || value;
            }
            return function setup(trait) {
                for (let key in props) {
                    trait.properties[key] = props[key];
                }
            };
        } else if (name === 'projectile') {
            const damage = this.getFloat(node, 'damage') || 0;
            const penetrates = this.getBool(node, 'penetrates') || false;
            const range = this.getFloat(node, 'range') || 100;
            const speed = this.getFloat(node, 'speed') || 100;
            return function setup(trait) {
                trait.setDamage(damage);
                trait.setRange(range);
                trait.setSpeed(speed);
                trait.penetratingForce = penetrates;
            };
        } else if (name === 'solid') {
            const attackAccept = this.parseAttack(node, 'attack');
            const fixed = this.getBool(node, 'fixed') || false;
            const obstructs = this.getBool(node, 'obstructs') || false;
            return function setup(trait) {
                trait.fixed = fixed;
                trait.obstructs = obstructs;
                if (attackAccept) {
                    trait.attackAccept = attackAccept;
                }
            };
        } else if (name === 'spawn') {
            const itemNodes = node.getElementsByTagName('item');
            const items = [];
            for (let itemNode, i = 0; itemNode = itemNodes[i]; ++i) {
                const offsetNode = itemNode.getElementsByTagName('offset')[0];
                let offset;
                if (offsetNode) {
                    offset = this.getVector3(offsetNode) || undefined;
                }
                const event = this.getAttr(itemNode, 'event') || 'death';
                const object = this.getAttr(itemNode, 'object');
                const constr = this.loader.resourceManager.get('object', object);
                items.push([event, constr, offset]);
            }
            return function setup(trait) {
                items.forEach(function(arg) {
                    trait.addItem(arg[0], arg[1], arg[2]);
                });
            };
        } else if (name === 'translate') {
            const velocity = this.getVector2(node);
            return function setup(trait) {
                trait.velocity.copy(velocity);
            };
        } else if (name === 'weapon') {
            const emitNode = node.getElementsByTagName('projectile-emit')[0];
            const projectileEmitOffset = emitNode && this.getVector2(emitNode) || new THREE.Vector2(0,0);
            const projectileEmitRadius = emitNode && this.getFloat(emitNode, 'r') || 0;
            return function setup(trait) {
                trait.projectileEmitOffset.copy(projectileEmitOffset);
                trait.projectileEmitRadius = projectileEmitRadius;
            }
        } else {
            const properties = {};
            for (let attr, parsed, i = 0; attr = node.attributes[i++];) {
                if (attr.name === 'source' || attr.name === 'name') {
                    continue;
                }
                parsed = parseFloat(attr.value);
                if (isFinite(parsed)) {
                    properties[attr.name] = parsed;
                } else {
                    properties[attr.name] = attr.value;
                }
            }
            return function setup(trait) {
                for (let key in properties) {
                    trait[key] = properties[key];
                }
            };
        }
    }
    parseAttack(node, attr)
    {
        const attack = node.getAttribute(attr);
        if (attack) {
            const surfaces = [];
            const SIDES = Engine.traits.Solid.SIDES;
            const map = {
                'top': SIDES.TOP,
                'bottom': SIDES.BOTTOM,
                'left': SIDES.LEFT,
                'right': SIDES.RIGHT,
            }
            const attacks = attack.split(' ');
            for (let i = 0, l = attacks.length; i !== l; ++i) {
                const a = attacks[i];
                if (map[a] === undefined) {
                    throw new Error('Invalid attack direction "' + a + '"');
                }
                surfaces.push(map[a]);
            }
            return surfaces;
        }
        return undefined;
    }
    parseTrait(node)
    {
        const name = this.getAttr(node, 'name');
        const blueprint = {
            name,
            constr: this.getConstructor(name),
            setup: this.getSetup(node),
        };
        return this.createConstructor(blueprint);
    }
}

'use strict';

Engine.Loader.XML.SceneParser =
class SceneParser
extends Engine.Loader.XML.Parser
{
    constructor(loader, node)
    {
        super(loader);

        this.DEFAULT_POS = new THREE.Vector3(0, 0, 0);
        this.BEHAVIOR_MAP = {
            'climbables': this._createClimbable,
            'deathzones': this._createDeathZone,
            'solids': this._createSolid,
        };

        this._node = node;
        this._scene = null;
        this._objects = {};
        this._bevahiorObjects = [];
        this._layoutObjects = [];
    }
    _createClimbable()
    {
        const object = new Engine.Object();
        object.applyTrait(new Engine.traits.Climbable);
        return object;
    }
    _createDeathZone()
    {
        const object = new Engine.Object();
        object.applyTrait(new Engine.traits.DeathZone);
        return object;
    }
    _createSolid() {
        const object = new Engine.Object();
        const solid = new Engine.traits.Solid;
        solid.fixed = true;
        solid.obstructs = true;
        object.applyTrait(solid);
        return object;
    }
    getBehavior(node)
    {
        const type = node.parentNode.tagName.toLowerCase();
        if (!this.BEHAVIOR_MAP[type]) {
            throw new Error('Behavior ' + type + ' not in behavior map');
        }
        const factory = this.BEHAVIOR_MAP[type];
        const rect = this.getRect(node);
        const instance = factory();
        instance.addCollisionRect(rect.w, rect.h);
        instance.position.x = rect.x;
        instance.position.y = rect.y;
        instance.position.z = 0;

        return {
            constructor: constructor,
            instance: instance,
            node: node,
        };
    }
    getScene()
    {
        if (!this._promise) {
            this._promise = this._parse();
        }
        return this._promise.then(scene => {
            scene.name = this._node.getAttribute('name');

            /* Perform update to "settle" world.
               This is done to prevent audio and other side effects
               from leaking out on scene start. */
            scene.world.simulateTime(0);
            return scene;
        });
    }
    _createObject(id)
    {
        return new (this._getObject(id)).constructor;
    }
    _getObject(id)
    {
        const resource = this.loader.resourceManager;
        if (this._objects[id]) {
            return this._objects[id];
        } else if (resource.has('object', id)) {
            return {constructor: resource.get('object', id)};
        }
        throw new Error(`Object "${id}" not defined.`);
    }
    _parse()
    {
        if (this._node.tagName !== 'scene') {
            throw new TypeError('Node not <scene>');
        }

        this._scene = new Engine.Scene();

        this._parseAudio();
        this._parseCamera();
        this._parseEvents();
        this._parseBehaviors();
        this._parseCamera();
        this._parseGravity();
        this._parseSequences();

        return this._parseObjects().then(() => {
            return this._parseLayout();
        }).then(() => {
            return this.loader.resourceLoader.complete();
        }).then(() => {
            return this._scene;
        });
    }
    _parseAudio()
    {
        const scene = this._scene;
        const nodes = this._node.querySelectorAll(':scope > audio > *');
        const tasks = [];
        for (let node, i = 0; node = nodes[i++];) {
            const id = this.getAttr(node, 'id');
            const task = this.getAudio(node).then(audio => {
                scene.audio.add(id, audio);
            });
            tasks.push(task);
        }
        return Promise.all(tasks);
    }
    _parseBehaviors()
    {
        const nodes = this._node.querySelectorAll(':scope > layout > behaviors > * > rect');
        const world = this._scene.world;
        for (let node, i = 0; node = nodes[i]; ++i) {
            const object = this.getBehavior(node);
            this._bevahiorObjects.push(object);
            world.addObject(object.instance);
        }
        return Promise.resolve();
    }
    _parseCamera()
    {
        const cameraNode = this._node.querySelector(':scope > camera');
        if (cameraNode) {
            const camera = this._scene.camera;
            const smoothing = this.getFloat(cameraNode, 'smoothing');
            if (smoothing) {
                camera.smoothing = smoothing;
            }

            const posNode = cameraNode.querySelector(':scope > position');
            if (posNode) {
                const position = this.getPosition(posNode);
                camera.position.copy(position);
            }

            const pathNodes = cameraNode.querySelectorAll(':scope > path');
            for (let pathNode, i = 0; pathNode = pathNodes[i]; ++i) {
                const path = this.getCameraPath(pathNode);
                camera.addPath(path);
            }
        }

        return Promise.resolve();
    }
    _parseEvents()
    {
        this._parseGlobalEvents();

        const node = this._node.querySelector(':scope > events');
        if (!node) {
            return Promise.resolve();
        }

        const parser = new Engine.Loader.XML.EventParser(this.loader, node);
        return parser.getEvents().then(events => {
            const scene = this._scene;
            events.forEach(event => {
                scene.events.bind(event.name, event.callback);
            });
        });
    }
    _parseGlobalEvents()
    {
        const eventsNode = this._node.querySelector(':scope > events');
        if (!eventsNode) {
            return;
        }
        const nodes = eventsNode.querySelectorAll('after > action, before > action');
        const scene = this._scene;
        for (let node, i = 0; node = nodes[i]; ++i) {
            const when = node.parentNode.tagName;
            const type = node.getAttribute('type');
            if (when === 'after' && type === 'goto-scene') {
                const id = node.getAttribute('id');
                scene.events.bind(scene.EVENT_END, () => {
                    this.loader.loadSceneByName(id).then(scene => {
                        this.loader.game.setScene(scene);
                    });
                })
            } else {
                throw new TypeError(`No mathing event for ${when} > ${type}`);
            }
        }
    }
    _parseGravity()
    {
        const node = this._node.getElementsByTagName('gravity')[0];
        if (node) {
            const gravity = this.getVector2(node);
            this._scene.world.gravityForce.copy(gravity);
        }
        return Promise.resolve();
    }
    _parseLayout()
    {
        const objectNodes = this._node.querySelectorAll(':scope > layout > objects > object');
        const world = this._scene.world;
        for (let objectNode, i = 0; objectNode = objectNodes[i]; ++i) {
            const layoutObject = this._parseLayoutObject(objectNode);
            world.addObject(layoutObject.instance);
            this._layoutObjects.push(layoutObject);
        }
        return Promise.resolve();
    }
    _parseLayoutObject(node)
    {
        const objectId = node.getAttribute('id');
        const instanceId = node.getAttribute('instance');
        const object = this._getObject(objectId);
        const instance = new object.constructor;
        instance.id = instanceId;

        const direction = this.getInt(node, 'dir') || 1;
        const position = this.getPosition(node) || this.DEFAULT_POS;

        instance.direction.set(direction, 0);
        instance.position.copy(position);

        if (instance.model) {
            const scale = this.getFloat(node, 'scale') || 1;
            instance.model.scale.multiplyScalar(scale);
        }

        const traitNodes = node.getElementsByTagName('trait');
        if (traitNodes) {
            const traitParser = new Engine.Loader.XML.TraitParser();
            const traits = [];
            for (let traitNode, i = 0; traitNode = traitNodes[i++];) {
                const Trait = traitParser.parseTrait(traitNode);
                const trait = new Trait;
                instance.applyTrait(trait);
            }
        }

        return {
            sourceNode: object.node,
            node: node,
            constructor: object.constructor,
            instance: instance,
        };
    }
    _parseObjects()
    {
        const nodes = this._node.querySelectorAll(':scope > objects');
        if (!nodes.length) {
            return Promise.resolve();
        }

        const tasks = [];
        for (let node, i = 0; node = nodes[i++];) {
            const parser = new Engine.Loader.XML.ObjectParser(this.loader, node);
            const task = parser.getObjects().then(objects => {
                Object.assign(this._objects, objects);
            });
            tasks.push(task);
        }

        return Promise.all(tasks);
    }
    _parseSequences()
    {
        const parser = new Engine.Loader.XML.SequenceParser;
        const node = this._node.querySelector(':scope > sequences');
        if (node) {
            const seq = this._scene.sequencer;
            parser.getSequences(node).forEach(item => {
                seq.addSequence(item.id, item.sequence);
            });
        }
    }
}

Engine.Player = function()
{
    this.character = null;
    this.defaultWeapon = null;
    this.input = null;
    this.lives = 3;
    this.weapons = {};
}

Engine.Player.prototype.equipWeapon = function(code)
{
    if (!this.character.weapon) {
        return false;
    }
    var weapon = this.weapons[code];
    this.character.weapon.equip(weapon);
}

Engine.Player.prototype.setCharacter = function(character)
{
    if (this.character) {
        this.character.isPlayer = false;
    }
    this.character = character;
    this.character.isPlayer = true;
}

'use strict';

Engine.Scene =
class Scene
{
    constructor()
    {
        this.EVENT_CREATE = 'create';
        this.EVENT_DESTROY = 'destroy';
        this.EVENT_END = 'end';
        this.EVENT_START = 'start';
        this.EVENT_PAUSE = 'pause';
        this.EVENT_RESUME = 'resume';

        this.EVENT_INPUT = 'input';

        this.audio = new Engine.AudioManager();
        this.sequencer = new Engine.SequenceManager(this);
        this.camera = new Engine.Camera;
        this.game = null;
        this.events = new Engine.Events(this);
        this.input = new Engine.Keyboard;
        this.timer = new Engine.Timer;
        this.world = new Engine.World;

        this.doFor = Engine.Loops.doFor(this.world.events, this.world.EVENT_SIMULATE);
        this.waitFor = Engine.Loops.waitFor(this.world.events, this.world.EVENT_SIMULATE);

        this.input.events.bind(this.input.EVENT_TRIGGER, (key, type) => {
            this.events.trigger(this.EVENT_INPUT, [key, type]);
        });

        this._inputRoute = (key, state) => {
            this.input.trigger(key, state);
        };

        this._timerBound = false;
        this._timerUpdate = (dt) => {
            this.world.updateTime(dt);
            this.camera.updateTime(dt);
        };

        const render = this.render = () => {
            this.game.renderer.render(this.world.scene,
                                      this.camera.camera);
        };

        const audioListener = (audio) => {
            this.game.audioPlayer.play(audio);
        };

        this.events.bind(this.EVENT_CREATE, (game) => {
            this.__create(game);
            this.timer.events.bind(this.timer.EVENT_RENDER, render);
            this.world.events.bind(this.world.EVENT_EMIT_AUDIO, audioListener);
        });

        this.events.bind(this.EVENT_START, () => {
            this.__start();
        });

        this.events.bind(this.EVENT_RESUME, () => {
            this.__resume();
        });

        this.events.bind(this.EVENT_PAUSE, () => {
            this.__pause();
        });

        this.events.bind(this.EVENT_END, () => {
            this.__end();
        });

        this.events.bind(this.EVENT_DESTROY, () => {
            this.__destroy();
            this.timer.events.unbind(this.timer.EVENT_RENDER, render);
            this.world.events.unbind(this.world.EVENT_EMIT_AUDIO, audioListener);
        });
    }
    __create(game)
    {
        this.game = game;
        this.audio.setPlayer(game.audioPlayer);

        const input = this.game.input;
        input.events.bind(input.EVENT_TRIGGER, this._inputRoute);
    }
    __start()
    {
        this.startSimulation();
    }
    __resume()
    {
        this.timer.run();
    }
    __pause()
    {
        this.input.release();
        this.timer.pause();
    }
    __end()
    {
        this.__pause();
    }
    __destroy()
    {
        this.stopSimulation();
        this.audio.stopAll();
        this.audio.unsetPlayer();

        const input = this.game.input;
        input.events.unbind(input.EVENT_TRIGGER, this._inputRoute);

        this.game = null;
    }
    pauseSimulation()
    {
        this.stopSimulation();
    }
    resumeSimulation()
    {
        this.startSimulation();
    }
    startSimulation()
    {
        if (!this._timerBound) {
            const t = this.timer;
            t.events.bind(t.EVENT_UPDATE, this._timerUpdate);
            this._timerBound = true;
        }
    }
    stopSimulation()
    {
        if (this._timerBound) {
            const t = this.timer;
            t.events.unbind(t.EVENT_UPDATE, this._timerUpdate);
            this._timerBound = false;
        }
    }
}

Engine.scenes = {};

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

Engine.traits.ContactDamage =
class ContactDamage extends Engine.Trait
{
    constructor()
    {
        super();

        this.NAME = 'contactDamage';
        this.EVENT_CONTACT_DAMAGE = 'contact-damage';

        this.points = 0;
    }
    __collides(withObject, ourZone, theirZone)
    {
        if (this.points !== 0 && withObject.health) {
            const direction = this._host.position.clone().sub(withObject.position);
            withObject.health.inflictDamage(this.points, direction);
            withObject.events.trigger(this.EVENT_CONTACT_DAMAGE, [this.points, direction]);
        }
    }
}

Engine.traits.DeathSpawn =
class DeathSpawn extends Engine.Trait
{
    constructor()
    {
        super();
        this.NAME = 'deathSpawn';

        this.chance = 1;
        this.pool = [];

        const onSpawn = () => {
            if (this._enabled) {
                this.spawn();
            }
        };

        this.events.bind(this.EVENT_ATTACHED, host => {
            host.events.bind(host.health.EVENT_DEATH, onSpawn);
        });

        this.events.bind(this.EVENT_DETACHED, host => {
            host.events.unbind(host.health.EVENT_DEATH, onSpawn);
        });
    }
    getRandom()
    {
        if (!this.pool.length) {
            return null;
        }

        const rand = Math.random();
        if (rand > this.chance) {
            return null;
        }

        const index = this.pool.length * Math.random() | 0;
        return new this.pool[index]();
    }
    spawn()
    {
        const spawn = this.getRandom();
        if (spawn) {
            const host = this._host;
            spawn.position.copy(host.position);
            host.world.addObject(spawn);
        }
    }
}

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

Engine.traits.Destructible =
class Destructible extends Engine.Trait
{
    constructor()
    {
        super();

        this.NAME = 'destructible';

        this.affectors = new Set;
    }
    __collides(withObject)
    {
        if (this.affectors.has(withObject.name)) {
            this._host.removeFromWorld();
        }
    }
}

Engine.traits.Disappearing =
class Disappearing extends Engine.Trait
{
    constructor()
    {
        super();
        this.NAME = 'disappearing';

        this._visible = true;

        this.offDuration = 3;
        this.onDuration = 2;

        this.offset = 0;
    }
    __timeshift(deltaTime, totalTime)
    {
        const totalDuration = this.onDuration + this.offDuration;
        const modTime = (totalTime + this.offset) % totalDuration;
        if (this._visible === false && modTime > this.offDuration) {
            this.admit();
        }
        else if (this._visible === true && modTime < this.offDuration) {
            this.retract();
        }
    }
    admit()
    {
        if (this._visible) {
            return;
        }

        const h = this._host;
        this._visible = true;
        h.model.visible = true;
        h.collidable = true;

        h.animators.forEach(animator => {
            animator.reset();
        });
    }
    retract()
    {
        if (!this._visible) {
            return;
        }

        const h = this._host;
        this._visible = false;
        h.model.visible = false;
        h.collidable = false;
    }
}

Engine.traits.Fallaway =
class Fallaway extends Engine.Trait
{
    constructor()
    {
        super();
        this.NAME = 'fallaway';
        this.__requires(Engine.traits.Physics);

        this._countdown = null;
        this._origin = null;

        this.delay = 1;
    }
    __attach(host)
    {
        super.__attach(host);
        this.reset();
    }
    __collides(withObject)
    {
        if (this._countdown === null && withObject.isPlayer) {
            this._countdown = this.delay;
        }
    }
    __timeshift(deltaTime)
    {
        if (this._countdown !== null) {
            this._countdown -= deltaTime;
            if (this._countdown <= 0) {
                this._origin = this._host.position.clone();
                this._host.physics.enable();
                this._countdown = null;
            }
        }
    }
    reset()
    {
        this._host.physics.disable();
        if (this._origin) {
            this._host.position.copy(this._origin);
            this._origin = null;
        }
    }
}

Engine.traits.FixedForce = class FixedForce extends Engine.Trait
{
    constructor()
    {
        super();
        this.NAME = 'fixedForce';
        this.force = new THREE.Vector2;
    }
    __timeshift(dt)
    {
        const v = this._host.velocity;
        const f = this.force;
        v.x += f.x * dt;
        v.y += f.y * dt;
    }
}

Engine.traits.Lifetime =
class Lifetime extends Engine.Trait
{
    constructor()
    {
        super();
        this.NAME = 'lifetime';

        this._time = 0;
        this.duration = Infinity;
    }
    __timeshift(dt)
    {
        if (this._time > this.duration) {
            var host = this._host;
            host.world.removeObject(host);
        } else {
            this._time += dt;
        }
    }
    reset()
    {
        this._time = 0;
    }
}

Engine.traits.Health =
class Health extends Engine.Trait
{
    constructor()
    {
        super();

        this.NAME = 'health';

        this.EVENT_DEATH = 'death';
        this.EVENT_HEALED = 'healed';
        this.EVENT_HURT = 'hurt';
        this.EVENT_RESURRECT = 'resurrect';
        this.EVENT_HEALTH_CHANGED = 'health-changed';

        this.energy = new Engine.logic.Energy(100);
        this.immune = false;
        this._dead = false;

        const onChange = () => {
            this._trigger(this.EVENT_HEALTH_CHANGED, [this]);
            if (!this._dead && this.energy.depleted) {
                this.kill();
            } else if (this._dead && !this.energy.depleted) {
                this.resurrect();
            }
        };

        this.events.bind(this.EVENT_ATTACHED, () => {
            this.energy.events.bind(this.energy.EVENT_CHANGE, onChange);
        });
        this.events.bind(this.EVENT_DETACHED, () => {
            this.energy.events.unbind(this.energy.EVENT_CHANGE, onChange);
        });
    }
    __collides(withObject)
    {
        if (withObject.pickupable && !this.energy.full) {
            const props = withObject.pickupable.properties;
            if (props.type === 'energy-tank') {
                withObject.world.removeObject(withObject);
                this.energy.amount += props.capacity;
                this._trigger(this.EVENT_HEALED);
            }
        }
    }
    kill()
    {
        if (this._dead === true) {
            return;
        }

        this._dead = true;
        this.energy.deplete();

        this._trigger(this.EVENT_DEATH, [this]);
        this._host.removeFromWorld();
    }
    inflictDamage(points, direction)
    {
        if (this.immune === true) {
            return false;
        }
        this.energy.amount -= points;
        this._trigger(this.EVENT_HURT, [points, direction]);
        return true;
    }
    reset()
    {
        this.resurrect();
        this.energy.fill();
    }
    resurrect()
    {
        if (this._dead === false) {
            return;
        }

        this._dead = false;
        this.energy.fill();
        this._trigger(this.EVENT_RESURRECT);
    }
}

Engine.traits.Invincibility =
class Invincibility extends Engine.Trait
{
    constructor()
    {
        super();
        this.NAME = 'invincibility';

        this._engaged = false;
        this._elapsed = 0;
        this._visibilityBlinkInterval = 1/60;

        this.duration = .5;

        const onHurt = () => {
            this.engage();
        };

        this.__requires(Engine.traits.Health);

        this.events.bind(this.EVENT_ATTACHED, host => {
            host.events.bind(host.health.EVENT_HURT, onHurt);
        });

        this.events.bind(this.EVENT_DETACHED, host => {
            host.events.unbind(host.health.EVENT_HURT, onHurt);
        });
    }
    __timeshift(deltaTime)
    {
        if (this._engaged) {
            this._host.model.visible = this._elapsed % (this._visibilityBlinkInterval * 2) > this._visibilityBlinkInterval;
            if (this._elapsed >= this.duration) {
                this.disengage();
            } else {
                this._elapsed += deltaTime;
            }
        }
    }
    disengage()
    {
        this._host.health.immune = false;
        this._host.model.visible = true;
        this._engaged = false;
    }
    engage()
    {
        if (this.duration !== 0) {
            this._host.health.immune = true;
            this._elapsed = 0;
            this._engaged = true;
        }
    }
    reset()
    {
        this.disengage();
    }
}

Engine.traits.Jump =
class Jump extends Engine.Trait
{
    constructor()
    {
        super();

        this.NAME = 'jump';
        this.EVENT_JUMP_ENGAGE = 'jump-engage';
        this.EVENT_JUMP_CANCEL = 'jump-cancel';
        this.EVENT_JUMP_END    = 'jump-end';
        this.EVENT_JUMP_LAND    = 'jump-land';

        this._fallcount = 0;

        this._elapsed = undefined;
        this._bump = new THREE.Vector2();
        this._ready = false;

        this.duration = .18;
        this.force = new THREE.Vector2(0, 100);
    }
    __obstruct(object, attack)
    {
        if (!this._enabled) {
            return;
        }

        if (attack === object.SURFACE_TOP) {
            if (this._ready === false) {
                this._trigger(this.EVENT_JUMP_LAND);
            }
            this.reset();
        } else if (attack === object.SURFACE_BOTTOM) {
            this._end();
        }
    }
    __timeshift(deltaTime)
    {
        if (!this._enabled) {
            return;
        }

        if (++this._fallcount >= 2) {
            this._ready = false;
        }

        if (this._elapsed === undefined) {
            return;
        } else if (this._elapsed >= this.duration) {
            this._end();
        } else {
            this._elapsed += deltaTime;
        }
    }
    _end()
    {
        this._elapsed = undefined;
        this._trigger(this.EVENT_JUMP_END);
    }
    engage()
    {
        if (!this._enabled) {
            return;
        }

        const host = this._host;

        if (host.climber !== undefined) {
            host.climber.release();
        }

        if (!this._ready) {
            return false;
        }

        this._bump.copy(this.force);
        this._bump.x *= host.direction.x;
        this._host.physics.velocity.add(this._bump);
        this._elapsed = 0;

        /* Immediately express "falling" state on jump. */
        this._fallcount = 2;

        this._trigger(this.EVENT_JUMP_ENGAGE);
    }
    cancel()
    {
        if (this._elapsed !== undefined) {
            const progress = (this.duration - this._elapsed) / this.duration;
            this._host.physics.velocity.y -= this.force.y * progress * .8;
            this._trigger(this.EVENT_JUMP_CANCEL);
        }
        this._end();
    }
    reset()
    {
        this._ready = true;
        this._fallcount = 0;
    }
}

Engine.traits.Translating =
class Translating extends Engine.Trait
{
    constructor()
    {
        super();
        this.NAME = 'translating';

        this.func = undefined;
        this.amplitude = new THREE.Vector2(1, 1);
        this.speed = 1;
    }
    __timeshift(deltaTime, totalTime)
    {
        switch (this.func) {
            case 'linear':
                return this.linear.apply(this, arguments);
            case 'oscillate':
                return this.oscillate.apply(this, arguments);
        }
    }
    linear(deltaTime, totalTime)
    {
        const v = this._host.velocity;
        v.x = this.amplitude.x * this.speed;
        v.y = this.amplitude.y * this.speed;
    }
    oscillate(deltaTime, totalTime)
    {
        const v = this._host.velocity,
              s = this.speed,
              t = totalTime + deltaTime / 2;
        v.x = Math.sin(t * s) * this.amplitude.x * s;
        v.y = Math.cos(t * s) * this.amplitude.y * s;
    }
}

Engine.traits.Rotate = function()
{
    Engine.Trait.call(this);
    this.speed = 1;
}

Engine.Util.extend(Engine.traits.Rotate, Engine.Trait);

Engine.traits.Rotate.prototype.NAME = 'rotate';

Engine.traits.Rotate.prototype.__timeshift = function(deltaTime, totalTime)
{
    this._host.model.rotation.z += (this.speed * deltaTime);
}

Engine.traits.Physics =
class Physics extends Engine.Trait
{
    constructor()
    {
        super();

        this.NAME = 'physics';

        this.area = 0.04;
        this.atmosphericDensity = 1.225;
        this.dragCoefficient = .045;
        this.mass = 0;

        this.acceleration = new THREE.Vector2();
        this.accelerationDelta = new THREE.Vector2();
        this.force = new THREE.Vector2();
        this.velocity = new THREE.Vector2();
    }
    __obstruct(object, attack)
    {
        if (attack === object.SURFACE_TOP) {
            this.velocity.copy(object.velocity);
        } else if (attack === object.SURFACE_BOTTOM) {
            this.velocity.y = object.velocity.y;
        } else if (attack === object.SURFACE_LEFT ||
                   attack === object.SURFACE_RIGHT) {
            this._host.velocity.x = object.velocity.x;
        }
    }
    __timeshift(dt)
    {
        if (this._enabled === false || this.mass <= 0) {
            return;
        }

        const g = this._host.world.gravityForce,
              v = this.velocity,
              a = this.acceleration,
              å = this.accelerationDelta,
              F = this.force,
              m = this.mass;

        F.y -= g.y * m;

        const Fd = this._calculateDrag();
        F.add(Fd);
        //console.log("Force: %f,%f, Resistance: %f,%f, Result: %f,%f", F.x, F.y, Fd.x, Fd.y, F.x - Fd.x, F.y - Fd.y);

        å.set(F.x / m, F.y / m);
        a.copy(å);
        v.add(a);

        this._host.velocity.copy(v);

        F.x = 0;
        F.y = 0;
    }
    _calculateDrag()
    {
        const ρ = this.atmosphericDensity,
             Cd = this.dragCoefficient,
              A = this.area,
              v = this._host.velocity;
        /* abs value for one velocity component to circumvent
           signage removal on v^2 . */
        return new THREE.Vector2(-.5 * ρ * Cd * A * v.x * Math.abs(v.x),
                                 -.5 * ρ * Cd * A * v.y * Math.abs(v.y));
    }
    bump(x, y)
    {
        this.velocity.x += x;
        this.velocity.y += y;
    }
    reset()
    {
        this.zero();
    }
    zero()
    {
        this.velocity.set(0, 0, 0);
        this._host.velocity.copy(this.velocity);
        this._host.integrator.reset();
    }
}

Engine.traits.Pickupable =
class Pickupable extends Engine.Trait
{
    constructor()
    {
        super();
        this.NAME = 'pickupable';
        this.EVENT_PICKUP = 'pickup',
        this.properties = {};
    }
}

Engine.traits.Move =
class Move extends Engine.Trait
{
    constructor()
    {
        super();

        this.NAME = 'move';

        this._interimSpeed = 0;

        this.acceleration = 500;
        this.speed = 90;
    }
    __obstruct(object, attack)
    {
        if (attack === object.SURFACE_LEFT && this._host.aim.x > 0
        || attack === object.SURFACE_RIGHT && this._host.aim.x < 0) {
            this._interimSpeed = Math.abs(object.velocity.x);
        }
    }
    __timeshift(deltaTime)
    {
        if (!this._enabled) {
            return;
        }
        this._handleWalk(deltaTime);
    }
    _handleWalk(dt)
    {
        const host = this._host;
        if (host.aim.x !== 0) {
            this._interimSpeed = Math.min(this._interimSpeed + this.acceleration * dt, this.speed);
            host.velocity.x += this._interimSpeed * host.aim.x;
        }
        else {
            this._interimSpeed = 0;
        }
    }
}

Engine.traits.Climber =
class Climber extends Engine.Trait
{
    constructor()
    {
        super();

        this.NAME = 'climber';

        this.attached = null;
        this.bounds = {
            climbable: null,
            host: null,
        };

        this.speed = 60;

        this.thresholds = {
            top: 2,
            bottom: 2,
            left: 0,
            right: 0,
        };
    }
    __collides(subject, ourZone, theirZone)
    {
        /* Don't regrab anything in the middle of climbing. */
        if (this.attached) {
            return;
        }

        /* Don't grab anything without climbable trait. */
        if (!subject.climbable) {
            return;
        }

        this.grab(subject, ourZone, theirZone);
    }
    __obstruct(object, attack)
    {
        /* If we touch ground, release climbable. */
        if (this._host.aim.y < 0 && attack === object.SURFACE_TOP) {
            this.release();
        }
    }
    __timeshift(deltaTime)
    {
        if (!this.attached) {
            return;
        }

        const host = this._host;

        if (host.aim.y > 0 && host.position.y > this.bounds.climbable.top - this.thresholds.top) {
            this.bounds.host.bottom = this.bounds.climbable.top;
            this.release();
            if (host.jump) {
                host.jump.reset();
            }
            return;
        } else if (host.aim.y < 0 && this.bounds.host.top < this.bounds.climbable.bottom) {
            this.release();
            return;
        }

        if (host.physics) {
            host.physics.zero();
        }

        host.velocity.copy(host.aim).setLength(this.speed);
        host.velocity.add(this.attached.velocity);

        this.constrain();
    }
    constrain()
    {
        const pos = this._host.position;
        const cli = this.bounds.climbable;
        const thr = this.thresholds;

        if (pos.y > cli.top - thr.top) {
            pos.y = cli.top - thr.top;
        }

        pos.x = this.attached.position.x;
    }
    grab(subject, me, climbable)
    {
        this.release();

        /* Don't grab ladder unless going up or down. */
        const host = this._host;
        if (host.aim.y === 0) {
            return false;
        }

        /* Don't grab ladder if on top and push up. */
        if (host.aim.y > 0) {
            if (host.position.y > climbable.top - this.thresholds.top) {
                return false;
            }
        }

        /* Don't grab ladder if going aiming down and not on top. */
        if (host.aim.y < 0 && me.bottom <= climbable.top - this.thresholds.top) {
            return false;
        }

        if (host.move) {
            host.move.disable();
        }

        this.bounds.climbable = climbable;
        this.bounds.host = me;

        this.attached = subject;
        this.attached.climbable.attach(host);

        this.constrain();

        return true;
    }
    release()
    {
        if (!this.attached) {
            return;
        }
        const host = this._host;
        if (host.move) {
            host.move.enable();
        }
        this.bounds.climbable = null;
        this.bounds.host = null;
        this.attached.climbable.detach(host);
        this.attached = null;
        if (host.physics) {
            host.physics.zero();
        }
    }
    reset()
    {
        this.release();
    }
}

'use strict';

Engine.traits.Solid =
class Solid extends Engine.Trait
{
    constructor()
    {
        super();

        this.NAME = 'solid';

        const SIDES = Engine.traits.Solid.SIDES;
        this.TOP = SIDES.TOP;
        this.BOTTOM = SIDES.BOTTOM;
        this.LEFT = SIDES.LEFT;
        this.RIGHT = SIDES.RIGHT;

        this.attackAccept = [
            this.TOP,
            this.BOTTOM,
            this.LEFT,
            this.RIGHT,
        ];

        this.fixed = false;
        this.obstructs = false;

        this.ignore = new Set();
    }
    __collides(subject, ourZone, theirZone)
    {
        if (!subject.solid) {
            return false;
        }
        if (this.ignore.has(subject)) {
            return false;
        }

        const host = this._host;

        const attack = this.attackDirection(ourZone, theirZone);

        if (this.attackAccept.indexOf(attack) < 0) {
            /*
            Collision is detected on a surface that should not obstruct.
            This puts this host in the ignore list until uncollides callback
            has been reached.
            */
            this.ignore.add(subject);
            return false;
        }

        if (this.obstructs) {
            const s = subject.velocity;
            const h = host.velocity;
            const affect = (attack === this.TOP && s.y < h.y) ||
                           (attack === this.BOTTOM && s.y > h.y) ||
                           (attack === this.LEFT && s.x > h.x) ||
                           (attack === this.RIGHT && s.x < h.x);

            if (affect === true) {
                subject.obstruct(host, attack, ourZone, theirZone);
            }
        }

        return attack;
    }
    __obstruct(object, attack, ourZone, theirZone)
    {
        if (this.fixed === true) {
            return;
        }
        if (attack === object.SURFACE_TOP) {
            theirZone.bottom = ourZone.top;
        } else if (attack === object.SURFACE_BOTTOM) {
            theirZone.top = ourZone.bottom;
        } else if (attack === object.SURFACE_LEFT) {
            theirZone.right = ourZone.left;
        } else if (attack === object.SURFACE_RIGHT) {
            theirZone.left = ourZone.right;
        }
    }
    __uncollides(subject, ourZone, theirZone)
    {
        this.ignore.delete(subject);
    }
    attackDirection(ourBounds, theirBounds)
    {
        const distances = [
            Math.abs(theirBounds.bottom - ourBounds.top),
            Math.abs(theirBounds.top - ourBounds.bottom),
            Math.abs(theirBounds.right - ourBounds.left),
            Math.abs(theirBounds.left - ourBounds.right),
        ];

        let dir = 0, l = 4, min = distances[dir];
        for (let i = 1; i < l; ++i) {
            if (distances[i] < min) {
                min = distances[i];
                dir = i;
            }
        }

        return dir;
    }
}

Engine.traits.Solid.SIDES = {
    TOP: Engine.Object.prototype.SURFACE_TOP,
    BOTTOM: Engine.Object.prototype.SURFACE_BOTTOM,
    LEFT: Engine.Object.prototype.SURFACE_LEFT,
    RIGHT: Engine.Object.prototype.SURFACE_RIGHT,
};

Engine.traits.Elevator =
class Elevator extends Engine.traits.Solid
{
    constructor()
    {
        super();

        this.NAME = 'elevator';

        this._initialized = false;
        this._distance = 0;
        this._nodes = [];
        this._offset = new THREE.Vector2;
        this._origo = new THREE.Vector3;
        this._nextPos = new THREE.Vector2;
        this._timeline = new Engine.Timeline;

        this.fixed = true;
        this.obstructs = true;
        this.attackAccept = [this.TOP];
        this.speed = 10;
    }
    __timeshift(dt)
    {
        if (!this._enabled) {
            return;
        }
        if (!this._initialized) {
            this._initialize();
            this._initialized = true;
        }

        const pos = this._host.position;
        const next = this._nextPos;
        pos.copy(next);
        pos.z = this._origo.z;

        this._distance += this.speed * dt;

        const offset = this.getOffset(this._distance).add(this._origo);
        next.copy(offset);

        this._host.velocity.copy(next)
                           .sub(pos)
                           .divideScalar(dt);
    }
    _initialize()
    {
        const pos = this._host.position;
        this._origo.copy(pos);
        this._nextPos.copy(pos);
    }
    addNode(vec2)
    {
        this._nodes.push(vec2);
        this._timeline.addFrame(vec2, vec2.length());
    }
    getOffset(distance)
    {
        const resolution = this._timeline.resolveTime(distance);
        const offset = this._offset;
        offset.set(0, 0);

        for (let i = 0; i !== resolution.index; ++i) {
            offset.add(this._nodes[i]);
        }

        const pos = this._nodes[resolution.index].clone();
        pos.setLength(resolution.resolvedLength - resolution.passedLength);

        offset.add(pos);

        return offset;
    }
}

Engine.traits.Climbable =
class Climbable extends Engine.traits.Solid
{
    constructor()
    {
        super();
        this.NAME = 'climbable';
        this.attackAccept = [this.TOP];
        this.fixed = true;
        this.obstructs = true;
    }
    __uncollides(subject)
    {
        if (subject.climber && subject.climber.attached === this._host) {
            subject.climber.release();
        }
        super.__uncollides(subject);
    }
    attach(subject)
    {
        this.ignore.add(subject);
    }
    detach(subject)
    {
        this.ignore.delete(subject);
    }
}

Engine.traits.Conveyor =
class Conveyor extends Engine.traits.Solid
{
    constructor()
    {
        super();
        this.NAME = 'conveyor';
        this.velocity = new THREE.Vector2(40, 0);
        this.fixed = true;
        this.obstructs = true;
    }
    __collides(subject)
    {
        const attack = super.__collides.apply(this, arguments);
        if (attack === this.TOP) {
            subject.velocity.copy(this.velocity);
        }
    }
    swapDirection()
    {
        const dir = this._host.direction;
        const vel = this.velocity;
        dir.x = -dir.x;
        vel.x = -vel.x;
    }
}

'use strict';

Engine.traits.Door =
class Door extends Engine.traits.Solid
{
    constructor()
    {
        super();

        this.NAME = 'door';

        this.fixed = true;
        this.obstructs = true;

        this.direction = new THREE.Vector2(0, 0);
        this.duration = .6;
        this.enabled = true;
        this.oneWay = false;
        this.speed = 30;

        this._traverseDestination = null;
        this._traverseObject = null;

        const traverseFunction = Engine.Animation.vectorTraverse;

        function accordion(geometry, start, step)
        {
            for (let i = start, l = geometry.vertices.length; i < l; ++i) {
                const v = geometry.vertices[i];
                v.y += step;
            }
            geometry.verticesNeedUpdate = true;
        }


        let step = 0;
        let stepTime = 0;
        let stepLength;

        this.sequencer = new Engine.Sequencer();
        this.sequencer.addStep(function start() {
            stepLength = this.duration / 4;
            stepTime = 0;
            return true;
        });
        this.sequencer.addStep(function open(dt) {
            stepTime += dt;
            if (stepTime >= stepLength) {
                stepTime = 0;
                accordion(this._host.model.geometry, ++step * 3, 16);
                if (step === 4) {
                    return true;
                }
            }
            return false;
        });
        this.sequencer.addStep(function traverse(dt) {
            return traverseFunction(this._traverseObject.position,
                                    this._traverseDestination,
                                    this.speed * dt) === 0;
        });
        this.sequencer.addStep(function close(dt) {
            stepTime += dt;
            if (stepTime >= stepLength) {
                stepTime = 0;
                accordion(this._host.model.geometry, step-- * 3, -16);
                if (step === 0) {
                    this._release();
                    return true;
                }
            }
            return false;
        });
    }
    __collides(withObject, ourZone, theirZone)
    {
        if (this._accept(withObject)) {
            const host = this._host;
            const width = (ourZone.width + theirZone.width) / 2;
            const dest = new THREE.Vector2(host.position.x + (host.position.x < withObject.position.x ? -width : width),
                                           withObject.position.y);
            if (this.oneWay) {
                this.enabled = false;
            }
            this._detain(withObject, dest);
        }
        else {
            super.__collides(withObject, ourZone, theirZone);
        }
    }
    __timeshift(dt)
    {
        if (this.sequencer.step > -1) {
            if (this._traverseObject) {
                this._traverseObject.velocity.copy(this._host.velocity);
            }
            this.sequencer.run(this, [dt]);
        }
    }
    _accept(subject)
    {
        if (this.enabled !== true) {
            return false;
        }

        if (!subject.isPlayer) {
            return false;
        }

        if (this._traverseObject !== null) {
            return false;
        }

        // Ignore collisions with currently handled object.
        if (subject === this._traverseObject) {
            return;
        }

        const host = this._host;
        const attackDirection = subject.position.clone();
        attackDirection.sub(host.position);
        if (this.direction.dot(attackDirection) < 0) {
            return false;
        }

        return true;
    }
    _detain(object, destination)
    {
        object.collidable = false;
        if (object.physics) {
            object.physics.zero();
            object.physics.disable();
        }
        if (object.move) {
            object.move.disable();
        }

        this._traverseObject = object;
        this._traverseDestination = destination;
        this.sequencer.start();
    }
    _release()
    {
        const object = this._traverseObject;
        object.collidable = true;
        if (object.physics) {
            object.physics.enable();
        }
        if (object.move) {
            object.move.enable();
        }
        this._traverseObject = null;
    }
}

'use strict';

Engine.traits.Spawn =
class Spawn extends Engine.Trait
{
    constructor()
    {
        super();
        this.NAME = 'spawn';

        this._conditions = [];

        this._bind = this._bind.bind(this);
        this._unbind = this._unbind.bind(this);
    }
    __attach()
    {
        super.__attach.apply(this, arguments);
        this._conditions.forEach(this._bind);
    }
    __detach()
    {
        this._conditions.forEach(this._unbind);
        super.__detach.apply(this, arguments);
    }
    _bind(condition)
    {
        this._host.events.bind(condition.event, condition.callback);
    }
    _unbind(condition)
    {
        this._host.events.unbind(condition.event, condition.callback);
    }
    addItem(event, constr, offset)
    {
        offset = offset || new THREE.Vector3(0, 0, 0);
        this._conditions.push({
            event: event,
            callback: function() {
                const object = new constr();
                object.position.copy(this.position);
                object.position.add(offset);
                this.world.addObject(object);
            },
        });
    }
}

Engine.traits.Stun =
class Stun extends Engine.Trait
{
    constructor()
    {
        super();

        this.NAME = 'stun';
        this.EVENT_STUN_ENGAGE = 'stun-engaged';
        this.EVENT_STUN_DISENGAGE = 'stun-disengage';

        this._bumpForce = new THREE.Vector2();
        this._elapsed = 0;
        this._engaged = false;

        this.duration = .5;
        this.force = 100;

        this.engage = this.engage.bind(this);
        this.disengage = this.disengage.bind(this);

        this.__requires(Engine.traits.Health);
        this.__requires(Engine.traits.Physics);
    }
    __attach(host)
    {
        const health = this.__require(host, Engine.traits.Health);
        super.__attach(host);
        this._bind(health.EVENT_HURT, this.engage);
    }
    __detach()
    {
        const health = this.__require(host, Engine.traits.Health);
        this._host.unbind(health.EVENT_HURT, this.engage);
        super.__detach(this._host);
    }
    __obstruct(object, attack)
    {
        if (this._engaged === true && attack === object.SURFACE_TOP) {
            this._bumpForce.multiplyScalar(.8);
            this._bump();
        }
    }
    __timeshift(deltaTime)
    {
        if (this._engaged) {
            if (this._elapsed >= this.duration) {
                this.disengage();
            }
            else {
                this._elapsed += deltaTime;
            }
        }
    }
    _bump()
    {
        this._host.physics.zero();
        this._host.physics.force.copy(this._bumpForce);
    }
    disengage()
    {
        if (this._engaged) {
            const move = this._host.move;
            const jump = this._host.jump;
            if (move) {
                move.enable();
            }
            if (jump) {
                jump.enable();
                jump.reset();
            }
            this._engaged = false;
        }
    }
    engage(points, direction)
    {
        if (this.duration !== 0 && this._engaged === false) {
            const host = this._host;
            const bump = this._bumpForce;

            bump.x = direction ? -direction.x : -host.direction.x;
            bump.y = Math.abs(bump.x * 2);
            bump.setLength(this.force);
            this._bump();

            const move = this._host.move;
            const jump = this._host.jump;
            if (move) {
                move.disable();
            }
            if (jump) {
                jump.disable();
            }
            this._engaged = true;
            this._elapsed = 0;
        }
    }
    reset()
    {
        this.disengage();
    }
}

Engine.traits.Teleport =
class Teleport extends Engine.Trait
{
    constructor()
    {
        super();
        this.NAME = 'teleport';

        this.EVENT_DEST_REACHED = 'teleport-dest-reached';
        this.EVENT_END = 'teleport-end';
        this.EVENT_START = 'teleport-start';

        this.STATE_OFF = 'off';
        this.STATE_IN = 'in';
        this.STATE_GO = 'go';
        this.STATE_OUT = 'out';

        this._destination = null;
        this._endProgress = 0;
        this._startProgress = 0;

        this.endDuration = .15;
        this.startDuration = .15;
        this.speed = 900;
        this.state = this.STATE_OFF;
    }
    __timeshift(dt)
    {
        if (this._destination) {
            this._handle(dt);
        }
    }
    _start()
    {
        this.state = this.STATE_IN;
        this._startProgress = this.startDuration;
        const host = this._host;
        host.collidable = false;
        if (host.physics) {
            host.physics.disable();
        }
        this._trigger(this.EVENT_START);
    }
    _end()
    {
        this.state = this.STATE_OUT;
        this._endProgress = this.endDuration;
    }
    _stop()
    {
        this.state = this.STATE_OFF;
        const host = this._host;
        host.collidable = true;
        if (host.physics) {
            host.physics.enable();
        }
        if (host.jump) {
            host.jump.reset();
        }
        this._destination = null;
        this._endProgress = 0;
        this._startProgress = 0;
    }
    _handle(dt)
    {
        /* Block velocity. */
        this._host.velocity.set(0, 0);

        if (this._startProgress > 0) {
            this._startProgress -= dt;
        }
        else if (this._endProgress > 0) {
            this._endProgress -= dt;
            if (this._endProgress <= 0) {
                this._trigger(this.EVENT_END);
                this._stop();
            }
        }
        else {
            this.state = this.STATE_GO;
            const teleportDistance = Engine.Animation.vectorTraverse(
                this._host.position, this._destination, this.speed * dt);
            if (teleportDistance === 0) {
                this._trigger(this.EVENT_DEST_REACHED);
                this._end();
            }
        }
    }
    nudge(vec2)
    {
        const dest = this._host.position.clone();
        dest.x += vec2.x;
        dest.y += vec2.y;
        this.to(dest);
    }
    reset()
    {
        this._stop();
    }
    to(vec2)
    {
        this._destination = vec2;
        this._start();
    }
}

Engine.traits.Translate =
class Translate extends Engine.Trait
{
    constructor()
    {
        super();
        this.NAME = 'translate';
        this.velocity = new THREE.Vector2(1, 1);
    }
    __timeshift(dt)
    {
        const pos = this._host.position;
        pos.x += this.velocity.x * dt;
        pos.y += this.velocity.y * dt;
    }
}

Engine.traits.Weapon =
class Weapon extends Engine.Trait
{
    constructor()
    {
        super();
        this.NAME = 'weapon';

        this.EVENT_FIRE = 'weapon-fire';
        this.EVENT_EQUIP = 'weapon-equip';

        this._firing = false;

        // Duration host left in shooting state after fire.
        this._timeout = .25;
        this._duration = Infinity;
        this._weapon = undefined;
        this.projectileEmitOffset = new THREE.Vector2();
        this.projectileEmitRadius = 0;
    }
    __collides(withObject)
    {
        if (withObject.pickupable && this._weapon && this._weapon.ammo.full === false) {
            const props = withObject.pickupable.properties;
            if (props.type === 'weapon-tank') {
                withObject.world.removeObject(withObject);
                this._weapon.ammo.amount += props.capacity;
            }
        }
    }
    __timeshift(deltaTime)
    {
        if (this._firing) {
            this._duration += deltaTime;
            if (this._duration >= this._timeout) {
                this._duration = Infinity;
                this._firing = false;
            }
        }

        if (this._weapon !== undefined) {
            this._weapon.timeShift(deltaTime);
        }
    }
    equip(weapon)
    {
        if (weapon instanceof Engine.objects.Weapon === false) {
            throw new Error('Invalid weapon');
        }
        this._weapon = weapon;
        this._weapon.setUser(this._host);
        this._trigger(this.EVENT_EQUIP, [weapon]);
    }
    fire()
    {
        if (this._host.stun && this._host.stun._engaged === true) {
            return false;
        }

        if (this._weapon === undefined) {
            return false;
        }

        if (!this._weapon.fire()) {
            return false;
        }

        this._firing = true;
        this._duration = 0;

        this._trigger(this.EVENT_FIRE, [this._weapon.id]);
        return true;
    }
}

Engine.traits.Light =
class Light extends Engine.Trait
{
    constructor()
    {
        super();
        this.NAME = 'light';

        this.EVENT_LAMP_CHANGE = 'lamp_change';

        this.direction = new THREE.Vector2();
        this.events = new Engine.Events();

        this.lamps = [];
        this.threshold = .8;
        this.easeOn = Engine.Easing.easeOutElastic();
        this.easeOff = Engine.Easing.easeOutQuint();

        this._nextUpdate = 0;
        this._updateFrequency = 2.5;
    }
    __timeshift(deltaTime)
    {
        if (this._nextUpdate > this._updateFrequency) {
            this._nextUpdate = 0;
            if (this._host.world === undefined) {
                return;
            }
            const ambientLight = this._host.world.ambientLight;
            if (ambientLight.color.r < this.threshold
            || ambientLight.color.g < this.threshold
            || ambientLight.color.b < this.threshold) {
                this.on();
            }
            else {
                this.off();
            }
        }

        this._updateLight(deltaTime);

        this._nextUpdate += deltaTime;
    }
    _updateLight(deltaTime)
    {
        const host = this._host;

        /* Ensure lights are always in Z front of host no matter rotation. */
        if (host.direction.x !== this.direction.x) {
            this.lamps.forEach(lamp => {
                const dist = Math.abs(lamp.light.position.z);
                lamp.light.position.z = host.direction.x > 0 ? dist : -dist;
            })
            this.direction.x = host.direction.x;
        }
    }
    _updateScene()
    {
        const host = this._host;
        this.lamps.forEach(lamp => {
            host.model.remove(lamp.light);
            host.model.add(lamp.light);
        });

        if (host.world) {
            host.world.scene.children.forEach(function(mesh) {
                if (mesh.material) {
                    mesh.material.needsUpdate = true;
                }
            });
        }
    }
    _startLamp(lamp)
    {
        if (lamp.state === true) {
            return;
        }
        lamp.state = true;
        const tween = new Engine.Tween({intensity: lamp.intensity}, this.easeOn);
        tween.addSubject(lamp.light);
        this._host.doFor(lamp.heatUpTime, (elapsed, progress) => {
            tween.update(progress);
        });
    }
    _stopLamp(lamp)
    {
        if (lamp.state === false) {
            return;
        }
        lamp.state = false;
        const tween = new Engine.Tween({intensity: 0}, this.easeOff);
        tween.addSubject(lamp.light);
        this._host.doFor(lamp.coolDownTime, (elapsed, progress) => {
            tween.update(progress);
        });
    }
    addLamp(light)
    {
        var lamp = new Engine.traits.Light.Lamp(light);
        this.lamps.push(lamp);
        return lamp;
    }
    on()
    {
        this._updateScene();
        this.lamps.forEach(lamp => {
            this._startLamp(lamp);
        });
    }
    off()
    {
        this.lamps.forEach(lamp => {
            this._stopLamp(lamp);
        });
    }
}

Engine.traits.Light.Lamp =
class Lamp
{
    constructor(light)
    {
        if (light === undefined) {
            this.light = new THREE.SpotLight(0xffffff, 0, 100);
        }
        else {
            this.light = light;
        }

        this.coolDownTime = 1;
        this.heatUpTime = .8;
        this.intensity = this.light.intensity;

        this.light.intensity = 0;
        this.state = false;
    }
}

Engine.traits.Glow =
class Glow extends Engine.traits.Light
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

Engine.traits.Projectile = class Projectile extends Engine.Trait
{
    constructor()
    {
        super();

        this.NAME = 'projectile';
        this.EVENT_HIT = 'hit';
        this.EVENT_RECYCLE = 'recycle';
        this.EVENT_RECYCLED = 'recycled';

        this._damage = 0;
        this._origin = new THREE.Vector2();
        this._range = Infinity;
        this._speed = 0;

        this.penetratingForce = false;

        const onRecycle = () => {
            this.recycle();
        };

        this.events.bind(this.EVENT_ATTACHED, host => {
            host.events.bind(this.EVENT_RECYCLE, onRecycle);
        });
        this.events.bind(this.EVENT_DETACHED, host => {
            host.events.unbind(this.EVENT_RECYCLE, onRecycle);
        });
    }
    __collides(withObject, ourZone, theirZone)
    {
        if (!withObject.health) {
            return false;
        }

        if (this._host.emitter == withObject) {
            return false;
        }

        const direction = this._host.position.clone().sub(withObject.position);
        withObject.health.inflictDamage(this._damage, direction);
        withObject.events.trigger(this.EVENT_HIT, [this._host]);
        if (!this.penetratingForce || !withObject.health.energy.depleted) {
            this.recycle();
        }
    }
    __timeshift(deltaTime)
    {
        if (this._origin.distanceTo(this._host.position) >= this._range) {
            this.rangeReached();
        }
    }
    deflect()
    {
        const host = this._host;
        host.collidable = false;
        const vel = host.velocity;
        const speed = vel.length();
        vel.x = -vel.x;
        vel.y = 100;
        vel.setLength(speed);
    }
    rangeReached()
    {
        this.recycle();
    }
    reset()
    {
        this._host.collidable = true;
    }
    recycle()
    {
        this._host.reset();
        this._trigger(this.EVENT_RECYCLED, [this._host]);
    }
    setDamage(points)
    {
        this._damage = points;
    }
    setDirection(vec)
    {
        this._host.velocity.copy(vec).setLength(this._speed);
        this._host.direction.copy(vec);
    }
    setOrigin(vec)
    {
        this._host.moveTo(vec);
        this._origin.copy(vec);
    }
    setRange(range)
    {
        this._range = range;
    }
    setSpeed(speed)
    {
        this._speed = speed;
    }
}

Engine.traits.Headlight =
class Headlight extends Engine.traits.Light
{
    constructor()
    {
        super();
        this.NAME = 'headlight';

        this.position = new THREE.Vector3(4, 7.5, -1);

        const target = new THREE.Object3D();
        target.position.set(200, -10, 0);

        this.beam = new THREE.SpotLight(0x8cc6ff, 20, 256);
        this.beam.angle = .6;
        this.beam.exponent = 50;
        this.beam.position.y = 7.5;
        this.beam.position.z = 6;
        this.beam.target = target;

        this.point = new THREE.PointLight(0x8cc6ff, 5, 30);
        this.point.position.copy(this.position);

        this.flare = new THREE.Mesh(
            new THREE.PlaneGeometry(64, 64),
            new THREE.MeshBasicMaterial({
                opacity: 0,
                side: THREE.DoubleSide,
                transparent: true,
            }));

        this.point.add(this.flare);

        this.headbob = 2;

        this.lamps = [
            new Engine.traits.Light.Lamp(this.beam),
            new Engine.traits.Light.Lamp(this.point),
        ];
    }
    __attach(host)
    {
        if (host.textures['headlight_lensflare']) {
            this.flare.material.map = host.textures['headlight_lensflare'].texture;
            this.flare.material.needsUpdate = true;
        }

        super.__attach(host);
        this._host.model.add(this.lamps[0].light);
        this._host.model.add(this.lamps[0].light.target);
    }
    __detach()
    {
        this.flare.material.map = undefined;
        this.flare.material.needsUpdate = true;

        this._host.model.remove(this.lamps[0].light);
        this._host.model.remove(this.lamps[0].light.target);
        super.__detach();
    }
    __timeshift(deltaTime)
    {
        const host = this._host,
              animator = host.animators[0];

        this.flare.material.opacity = this.point.intensity / this.lamps[1].intensity;

        this.point.position.y = this.beam.position.y = this.position.y;
        if (animator._currentAnimation === host.animations.run) {
            if (animator._currentIndex === 1 || animator._currentIndex === 3) {
                this.point.position.y = this.beam.position.y -= this.headbob;
            }
        }

        super.__timeshift.apply(this, arguments);
    }
}

Engine.traits.LightControl =
class LightControl extends Engine.Trait
{
    constructor()
    {
        super();
        this.NAME = 'lightcontrol';

        this.color = new THREE.Color(1,1,1);
        this.duration = 1;

        this._ignore = new Set();
        this._progress = null;
        this._tween = null;
    }
    __collides(withObject)
    {
        const color = this._host.world.ambientLight.color;
        if (this._progress === null &&
            withObject.isPlayer === true &&
            this.color.equals(color) === false &&
            this._ignore.has(withObject) === false)
        {
            this._tween = new Engine.Tween({
                r: this.color.r,
                g: this.color.g,
                b: this.color.b,
            });
            this._tween.addSubject(color);
            this._progress = 0;
            this._ignore.add(withObject);
        }
    }
    __uncollides(withObject)
    {
        this._ignore.delete(withObject);
    }
    __timeshift(deltaTime)
    {
        if (this._progress === null) {
            return;
        }
        this._progress += deltaTime;
        let frac = this._progress / this.duration;
        if (frac > 1) {
            frac = 1;
            this._progress = null;
        }
        this._tween.update(frac);
    }
}

Engine.objects.Spawner =
class Spawner extends Engine.Object
{
    constructor()
    {
        super();

        this._accumulatedTime = 0;
        this._children = [];
        this._spawnCount = 0;

        this.ai = new Engine.AI(this);
        this.childLifetime = null;
        this.interval = 1;
        this.maxDistance = null;
        this.minDistance = null;
        this.maxSimultaneousSpawns = 1;
        this.maxTotalSpawns = Infinity;
        this.pool = [];
        this.roamingLimit = null;
    }
    _cleanReferences()
    {
        const w = this.world;
        this._children = this._children.filter(child => {
            return w.hasObject(child);
        });
    }
    _killOffElderly()
    {
        this._children = this._children.filter(child => {
            if (child.time >= this.childLifetime) {
                child.health.kill();
                return false;
            }
            return true;
        });
    }
    _killOffRoaming()
    {
        const world = this.world;
        this._children = this._children.filter(child => {
            if (child.position.distanceTo(this.position) > this.roamingLimit) {
                child.health.kill();
                return false;
            } else {
                return true;
            }
        });
    }
    getChildren()
    {
        return this._children;
    }
    reset()
    {
        const children = this._children;
        children.forEach(child => {
            this.world.removeObject(child);
        });
        this._children = [];
        this._accumulatedTime = 0;
        this._spawnCount = 0;
    }
    spawnObject()
    {
        if (this.pool.length === 0) {
            return false;
        }
        if (this._children.length >= this.maxSimultaneousSpawns) {
            return false;
        }
        if (this._spawnCount >= this.maxTotalSpawns) {
            return false;
        }

        if (this.minDistance || this.maxDistance) {
            const player = this.ai.findPlayer();
            if (player) {
                const dist = this.position.distanceTo(player.position);
                if (this.maxDistance && dist > this.maxDistance ||
                    this.minDistance && dist < this.minDistance) {
                    return false;
                }
            }
        }

        const index = Math.floor(Math.random() * this.pool.length);
        const object = new this.pool[index]();

        object.position.copy(this.position);
        object.position.z = 0;

        this._children.push(object);
        this.world.addObject(object);

        ++this._spawnCount;

        return object;
    }
    timeShift(dt)
    {
        this._accumulatedTime += dt;
        if (this.childLifetime !== null) {
            this._killOffElderly();
        }
        if (this.roamingLimit !== null) {
            this._killOffRoaming();
        }
        if (this.interval > 0 && this._accumulatedTime >= this.interval) {
            let overdue = Math.floor(this._accumulatedTime / this.interval);
            this._accumulatedTime -= overdue * this.interval;
            this._cleanReferences();
            while (overdue--) {
                if (!this.spawnObject()) {
                    break;
                }
            }
        }
    }
}


module.exports = Engine;
