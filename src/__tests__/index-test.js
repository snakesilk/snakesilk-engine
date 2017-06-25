const expect = require('expect.js');
const sinon = require('sinon');
const packageJSON = require('../../package.json');
const Main = require('../index.js');

describe('Main Export', function() {
  it('is defined in package.json', () => {
    expect(packageJSON.main).to.be('./src/index.js');
  });

  [
    ['Game', '../Game'],
    ['Entity', '../Entity'],
    ['InputPlayer', '../InputPlayer'],
    ['InputRecorder', '../InputRecorder'],
    ['Mouse', '../Mouse'],
    ['Hud', '../Hud'],
    ['Scene', '../Scene'],
  ].forEach(([module, target]) => {
    it(`exposes ${module}`, () => {
      expect(Main[module]).to.be(require(target));
    });
  });
});
