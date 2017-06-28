const Animation = require('./Animation');
const Camera = require('./Camera');
const Game = require('./Game');
const Easing = require('./Easing');
const Entity = require('./Entity');
const Loader = require('./Loader');
const Objects = require('./object/index.js');
const Scene = require('./Scene');
const Traits = require('./traits');
const Tween = require('./Tween');
const World = require('./World');

const UVAnimator = require('./animator/UV');
const UVCoords = require('./UVCoords');

const BitmapFont = require('./BitmapFont');
const InputPlayer = require('./InputPlayer');
const InputRecorder = require('./InputRecorder');
const SyncPromise = require('./SyncPromise');

const Mouse = require('./Mouse');
const Hud = require('./Hud');

module.exports = {
    Animation,
    Camera,
    Game,
    Easing,
    Entity,
    Loader,
    Objects,
    Scene,
    Traits,
    Tween,
    World,

    UVAnimator,
    UVCoords,

    BitmapFont,
    InputPlayer,
    InputRecorder,
    SyncPromise,
    Mouse,
    Hud,
};
