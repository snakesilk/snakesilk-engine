const expect = require('expect.js');
const sinon = require('sinon');

const env = require('../env');
const ResourceManager = env.Engine.ResourceManager;

describe('ResourceManager', function() {
  describe('when instantiated', () => {
    let rm;

    beforeEach(() => {
      rm = new ResourceManager();
    });

    [
      ['addAudio', 'audio'],
      ['addFont', 'font'],
      ['addObject', 'object'],
      ['addTexture', 'texture'],
    ].forEach(([fn, type]) => {
      describe(`${fn}()`, () => {
        const ITEM = Symbol();

        it('fires an event when item added', () => {
          const listener = sinon.spy();
          rm.events.bind(rm.EVENT_ADDED, listener);
          rm[fn]('3251vg21', ITEM);
          expect(listener.callCount).to.be(1);
          expect(listener.lastCall.args[0]).to.be(type);
          expect(listener.lastCall.args[1]).to.be('3251vg21');
          expect(listener.lastCall.args[2]).to.be(ITEM);
        });
      });
    });

    describe('get()', () => {
      it('returns item when exists', () => {
        const ITEM = Symbol();
        rm.addObject('12y126t12', ITEM);
        expect(rm.get('object', '12y126t12')).to.be(ITEM);
      });
    });

    describe('getAsync()', () => {
      it('returns promise that resolves when item is added', (done) => {
        const ITEM = Symbol();

        rm.getAsync('object', '12y126t12').then(item => {
          expect(item).to.be(ITEM);
          done();
        });

        rm.addObject('12y126t12', ITEM);
      });

      it('returns resolved promise if item already exists', (done) => {
        const ITEM = Symbol();
        rm.addObject('12y126t12', ITEM);

        rm.getAsync('object', '12y126t12').then(item => {
          expect(item).to.be(ITEM);
          done();
        });
      });
    });

    describe('has()', () => {
      it('returns true if item exists', () => {
        const ITEM = Symbol();
        rm.addObject('12y126t12', ITEM);
        expect(rm.has('object', '12y126t12')).to.be(true);
      });

      it('returns false if item does not exist', () => {
        expect(rm.has('object', '12y126t12')).to.be(false);
      });
    });
  });
});
