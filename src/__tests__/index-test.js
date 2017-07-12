const expect = require('expect.js');
const sinon = require('sinon');
const packageJSON = require('../../package.json');
const Main = require('../index.js');

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
      'Hud',
      'Objects',
      'Traits',
    ].forEach(prop => {
      it(`deprecated export ${prop} is missing`, () => {
        expect(Main).to.not.have.property(prop);
      });
    });
  });
});
