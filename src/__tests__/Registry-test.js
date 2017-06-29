const expect = require('expect.js');
const sinon = require('sinon');

const Registry = require('../Registry');

describe('Registry', function() {
  describe('after instantiation', () => {
    let registry;

    beforeEach(() => {
      registry = new Registry();
    });

    describe('when adding items', () => {
      const ITEM_1 = Symbol('item 1');
      const ITEM_2 = Symbol('item 2');

      beforeEach(() => {
        sinon.stub(console, 'warn');
        registry.add({
          'item1': ITEM_1,
          'item2': ITEM_2,
        });
      });

      afterEach(() => {
        console.warn.restore();
      });

      it('makes items resolvable', () => {
        expect(registry.resolve('item1')).to.be(ITEM_1);
        expect(registry.resolve('item2')).to.be(ITEM_2);
      });

      it('emits warning when overwriting keys', () => {
        expect(console.warn.callCount).to.be(0);
        registry.add({'item1': 'moot'});
        expect(console.warn.callCount).to.be(1);
        expect(console.warn.lastCall.args).to.eql(['Overwriting "item1".']);
      });

      it('throws error if entries not object', () => {
        expect(() => {
          registry.add('item1', 'moot');
        }).to.throwError(error => {
          expect(error).to.be.a(TypeError);
          expect(error.message).to.be('Entries must be Object.');
        });
      });
    });
  });
});
