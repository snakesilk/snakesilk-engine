const expect = require('expect.js');
const sinon = require('sinon');
const packageJSON = require('../../package.json');
const Main = require('../index.js');

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
});
