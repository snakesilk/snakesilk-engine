const expect = require('expect.js');
const sinon = require('sinon');
const packageJSON = require('../../package.json');
const Main = require('../index.js');

const Trait = require('../Trait');

describe('Main Export', function() {
  it('is defined in package.json', () => {
    expect(packageJSON.main).to.be('./src/index.js');
  });

  [
    ['Animation', '../Animation'],

    ['Game', '../Game'],
    ['Entity', '../Entity'],
    ['Loader', '../Loader'],
    ['Scene', '../Scene'],
    ['Tween', '../Tween'],

    ['UVAnimator', '../animator/UV'],
    ['UVCoords', '../UVCoords'],

    ['BitmapFont', '../BitmapFont'],
    ['InputPlayer', '../InputPlayer'],
    ['InputRecorder', '../InputRecorder'],
    ['SyncPromise', '../SyncPromise'],

    ['Mouse', '../Mouse'],
    ['Hud', '../Hud'],

  ].forEach(([module, target]) => {
    it(`exposes ${module}`, () => {
      expect(Main[module]).to.be(require(target));
    });
  });

  [
    'Attach',
    'Climbable',
    'Climber',
    'ContactDamage',
    'Conveyor',
    'DeathSpawn',
    'DeathZone',
    'Destructible',
    'Disappearing',
    'Door',
    'Elevator',
    'Environment',
    'Fallaway',
    'FixedForce',
    'Glow',
    'Headlight',
    'Health',
    'Invincibility',
    'Jump',
    'Lifetime',
    'Light',
    'LightControl',
    'Move',
    'Physics',
    'Pickupable',
    'Projectile',
    'Rotate',
    'Solid',
    'Spawn',
    'Stun',
    'Teleport',
    'Translate',
    'Translating',
    'Weapon',
  ].forEach((traitName) => {
    it(`exposes trait ${traitName}`, () => {
      expect(new (Main.Traits[traitName])()).to.be.a(Trait);
    });
  });
});
