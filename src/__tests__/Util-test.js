const expect = require('expect.js');
const sinon = require('sinon');

const Util = require('../../src/Util');

describe('Util', function() {
  describe('#renameFunction', () => {
    it('returns a function with a new name', () => {
      const res = Util.renameFunction('foo', function bar() {});
      expect(res.name).to.be('foo');
    });
  });

  describe('#string.fill', () => {
    it('does not exist', () => {
      expect(Util).to.not.have.property('string');
    });
  });
});
