const expect = require('expect.js');

describe('Build', () => {
  let SnakeSilk;

  it('generates a requirable bundle', () => {
    SnakeSilk = require('../../build/snakesilk');
  });

  describe('Bundle', () => {
    [
      'Game',
    ].forEach(prop => {
      it(`exposes ${prop} property`, () => {
        expect(SnakeSilk).to.have.property(prop);
      });
    });
  });
});
