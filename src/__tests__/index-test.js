const expect = require('expect.js');
const sinon = require('sinon');
const packageJSON = require('../../package.json');
const Main = require('../index.js');

const Trait = require('../Trait');

describe('Main Export', function() {
  it('is defined in package.json', () => {
    expect(packageJSON.main).to.be('./dist/index.js');
  });

  describe('Exports', () => {
    [
      ['AI', '../AI'],
      ['Animation', '../Animation'],
      ['Camera', '../Camera'],
      ['Game', '../Game'],
      ['Entity', '../Entity'],
      ['Events', '../Events'],
      ['Keyboard', '../Keyboard'],
      ['Loader', '../Loader'],
      ['Scene', '../Scene'],
      ['Trait', '../Trait'],
      ['Tween', '../Tween'],
      ['World', '../World'],

      ['UVAnimator', '../animator/UV'],
      ['UVCoords', '../UVCoords'],

      ['BitmapFont', '../BitmapFont'],
      ['InputPlayer', '../InputPlayer'],
      ['InputRecorder', '../InputRecorder'],
      ['SyncPromise', '../SyncPromise'],

      ['Mouse', '../Mouse'],
    ].forEach(([module, target]) => {
      it(`exposes ${module}`, () => {
        expect(Main[module]).to.be(require(target));
      });
    });

    it('exports Energy class', () => {
      expect(Main.Logic.Energy).to.be(require('../logic/Energy'));
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

    [
      'Hud',
      'Objects',
    ].forEach(prop => {
      it(`deprecated export ${prop} is missing`, () => {
        expect(Main).to.not.have.property(prop);
      });
    });
  });
});
