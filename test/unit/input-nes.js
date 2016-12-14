const expect = require('expect.js');
const sinon = require('sinon');

const env = require('../env');
const NESController = env.Engine.Input.NES;

describe('NES Input Mapper', () => {
  describe('when instantiated', () => {
    let mapper, spy;

    function ensurePad(x, y) {
      it(`direction is (${x}, ${y})`, () => {
        expect(mapper.getDirection()).to.eql({x, y});
      });
    }

    beforeEach(() => {
      mapper = new NESController();
      spy = sinon.spy();
      mapper.events.bind(mapper.EVENT_DPAD, spy);
    });

    ensurePad(0, 0);

    describe('and pressing LEFT', () => {
      beforeEach(() => {
        mapper.trigger(mapper.LEFT, true);
      });

      ensurePad(-1, 0);

      describe('then pressing RIGHT', () => {
        beforeEach(() => {
          mapper.trigger(mapper.RIGHT, true);
        });

        ensurePad(0, 0);

        describe('then releasing RIGHT', () => {
          beforeEach(() => {
            mapper.trigger(mapper.RIGHT, false);
          });

          ensurePad(-1, 0);
        });
      });
    });

    describe('and pressing RIGHT', () => {
      beforeEach(() => {
        mapper.trigger(mapper.RIGHT, true);
      });

      ensurePad(1, 0);

      describe('then pressing LEFT', () => {
        beforeEach(() => {
          mapper.trigger(mapper.LEFT, true);
        });

        ensurePad(0, 0);

        describe('then releasing LEFT', () => {
          beforeEach(() => {
            mapper.trigger(mapper.LEFT, false);
          });

          ensurePad(1, 0);
        });
      });
    });

    describe('and pressing UP', () => {
      beforeEach(() => {
        mapper.trigger(mapper.UP, true);
      });

      ensurePad(0, 1);

      describe('then pressing DOWN', () => {
        beforeEach(() => {
          mapper.trigger(mapper.DOWN, true);
        });

        ensurePad(0, 0);

        describe('then releasing DOWN', () => {
          beforeEach(() => {
            mapper.trigger(mapper.DOWN, false);
          });

          ensurePad(0, 1);
        });
      });
    });

    describe('and pressing DOWN', () => {
      beforeEach(() => {
        mapper.trigger(mapper.DOWN, true);
      });

      ensurePad(0, -1);

      describe('then pressing UP', () => {
        beforeEach(() => {
          mapper.trigger(mapper.UP, true);
        });

        ensurePad(0, 0);

        describe('then releasing UP', () => {
          beforeEach(() => {
            mapper.trigger(mapper.UP, false);
          });

          ensurePad(0, -1);
        });
      });
    });

    [
      ['LEFT', {x: -1, y: 0}],
      ['RIGHT', {x: 1, y: 0}],
      ['UP', {x: 0, y: 1}],
      ['DOWN', {x: 0, y: -1}],
    ].forEach(([key, dir]) => {
      it(`trigger ${key} emits DPAD event`, () => {
        const spy = sinon.spy();
        mapper.events.bind(mapper.EVENT_DPAD, spy);
        mapper.trigger(key, true);
        expect(spy.callCount).to.be(1);
        expect(spy.lastCall.args[0]).to.eql(dir);
        expect(spy.lastCall.args[1]).to.be(true);
      });
    });

    [
      'A',
      'B',
      'SELECT',
      'START',
    ].forEach((key) => {
      it(`trigger ${key} emits BUTTON event`, () => {
        const spy = sinon.spy();
        mapper.events.bind(mapper.EVENT_BUTTON, spy);
        mapper.trigger(key, true);
        expect(spy.callCount).to.be(1);
        expect(spy.lastCall.args[0]).to.be(key);
      });
    });
  });
});
