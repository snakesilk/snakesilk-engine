const expect = require('expect.js');
const sinon = require('sinon');

const {Object3D} = require('three');
const BoundingBox = require('../BoundingBox');
const Entity = require('../Entity');
const Trait = require('../Trait');

describe('Entity', () => {
  let MockTrait;

  before(() => {
    MockTrait = class extends Trait {
      constructor() {
        super();
        this.NAME = 'mockTrait';
      }
    }
  });

  describe('on instantiation', () => {
    let entity;

    beforeEach(() => {
      entity = new Entity();
    });

    it('direction is set to right', () => {
      expect(entity.direction).to.eql({x: 1, y: 0});
    });

    it('has a default model', () => {
      expect(entity.model).to.be.an(Object3D);
    });

    describe('.textures', () => {
      it('is read only', () => {
        entity.textures.set('foo', 'bar');
        entity.textures = {};
        expect(entity.textures.get('foo')).to.be('bar');
      });
    });

    describe('#addCollisionRect', () => {
      describe('without offset', () => {
        beforeEach(() => {
          entity.addCollisionRect(23, 43);
        });

        it('adds a BoundingBox as collision zone', () => {
          expect(entity.collision[0]).to.be.a(BoundingBox);
        });

        it('propagates own position', () => {
          entity.position.set(3,4,1);
          expect(entity.collision[0].position).to.eql({
            x: 3,
            y: 4,
            z: 1
          });
        });

        it('default offset is 0, 0', () => {
          expect(entity.collision[0].left).to.equal(-11.5);
          expect(entity.collision[0].top).to.equal(21.5);
        });
      });

      describe('with offset', () => {
        beforeEach(() => {
          entity.addCollisionRect(23, 43, 7, 4);
        });

        it('offset is honored', () => {
          expect(entity.collision[0].left).to.equal(-4.5);
          expect(entity.collision[0].top).to.equal(25.5);
        });
      });
    });

    describe('#addCollisionZone', () => {
      it('calls addCollisionRect with radius as square', () => {
        sinon.stub(entity, 'addCollisionRect');
        entity.addCollisionZone(4.3, 2, 3);
        expect(entity.addCollisionRect.callCount).to.be(1);
        expect(entity.addCollisionRect.lastCall.args).to.eql([8.6, 8.6, 2, 3]);
      });
    });

    describe('#applyTrait', () => {
      it('exposes trait name on entity', () => {
        const trait = new MockTrait();
        entity.applyTrait(trait);
        expect(entity.mockTrait).to.be(trait);
      });

      it('excepts if trait name occupied', () => {
        const trait = new MockTrait();
        entity.applyTrait(trait);
        expect(() => {
          entity.applyTrait(trait);
        }).to.throwError(function(error) {
          expect(error).to.be.an(Error);
          expect(error.message).to.equal('Trait name "mockTrait" occupied.');
        });
      });
    });

    describe('#getTrait', () => {
      class MyTrait extends Trait{}

      describe('when not applied', () => {
        it('returns null', () => {
          expect(entity.getTrait(MyTrait)).to.be(false);
        });
      });

      describe('when trait applied', () => {
        let trait;

        beforeEach(() => {
          trait = new MyTrait();
          entity.applyTrait(trait);
        });

        it('returns trait instance based on class', () => {
          expect(entity.getTrait(MyTrait)).to.be(trait);
        });
      });
    });

    describe('#reset()', () => {
      it('resets aim to 0, 0', () => {
        const host = new Entity();
        host.aim.set(1, 1);
        host.reset();
        expect(host.aim).to.eql({x: 0, y: 0});
      });
    });

    describe('#doFor()', () => {
      it('runs callback until time duration reached', () => {
        const callbackSpy = sinon.spy();
        entity.doFor(1, callbackSpy);
        entity.timeShift(1);
        expect(callbackSpy.callCount).to.be(1);
        entity.timeShift(1);
        expect(callbackSpy.callCount).to.be(1);
      });

      it('returns a promise that resolves when done', function(done) {
        const callbackSpy = sinon.spy();
        entity.doFor(2, callbackSpy).then(time => {
          done();
        });
        entity.timeShift(2.1);
      });
    });

    describe('#setAnimation()', () => {
      let spy;

      beforeEach(() => {
        spy = sinon.spy();

        entity.animators.push({
          setAnimation: spy,
        });

        entity.animations.set('foo', 'bar');
        entity.animations.set('doo', 'rar');

        entity.setAnimation('foo');
      });

      it('calls first animator animation for name', () => {
        expect(spy.callCount).to.be(1);
        expect(spy.lastCall.args[0]).to.be('bar');
      });

      describe('when called with same name', () => {
        it('ignores', () => {
          entity.setAnimation('foo');
          expect(spy.callCount).to.be(1);
        });
      });

      describe('when called with another name', () => {
        it('updates again', () => {
          entity.setAnimation('doo');
          expect(spy.callCount).to.be(2);
          expect(spy.lastCall.args[0]).to.be('rar');
        });
      });
    });

    describe('#timeShift()', () => {
      it('multiplies time with object time multiplier', () => {
        const callbackSpy = sinon.spy();
        entity.events.bind(entity.EVENT_TIMESHIFT, callbackSpy);
        entity.timeStretch = 1.3;
        entity.timeShift(1.7);
        expect(callbackSpy.lastCall.args).to.eql([2.21, 0]);
        entity.timeShift(1.29);
        expect(callbackSpy.lastCall.args).to.eql([1.677, 2.21]);
      });
    });

    describe('#useTexture()', () => {
      describe('when texture not defined', () => {
        beforeEach(() => {
          sinon.stub(console, 'error');
        });

        afterEach(() => {
          console.error.restore();
        });

        it('logs an error', () => {
          const result = entity.useTexture('undefined texture');
          expect(result).to.be(undefined);
          expect(console.error.callCount).to.be(1);
          expect(console.error.lastCall.args).to.eql([
            'Texture "undefined texture" not defined.',
          ]);
        });
      });

      describe('when texture defined', () => {
        const FAKE_TEXTURE = Symbol('fake texture');

        beforeEach(() => {
          entity.textures.set('my-texture-id', {texture: FAKE_TEXTURE});
          entity.model.material = {
            map: undefined,
            needsUpdate: false,
          };
          entity.useTexture('my-texture-id');
        });

        it('sets texture on material', () => {
          expect(entity.model.material.map).to.be(FAKE_TEXTURE);
        });

        it('sets needsUpdate flag', () => {
          expect(entity.model.material.needsUpdate).to.be(true);
        });
      });
    });

    describe('#waitFor()', () => {
      it('returns a promise that resolves when duration elapsed', function(done) {
        const callbackSpy = sinon.spy();
        entity.waitFor(2).then(time => {
          done();
        });
        entity.timeShift(2);
      });
    });

    [
      'dropCollision',
      'nudge',
    ].forEach(prop => {
      describe(`deprecated #${prop}`, () => {
        it('does not exist', () => {
          expect(entity).to.not.have.property(prop);
        });
      });
    });
  });
});
