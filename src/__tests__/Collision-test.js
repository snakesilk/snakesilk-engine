'use strict';

const expect = require('expect.js');
const sinon = require('sinon');

const Collision = require('../Collision');
const Entity = require('../Entity');

describe('Collision', function() {
  describe('on instantiation', () => {
    let collision;

    beforeEach(() => {
      collision = new Collision();
    });

    describe('#addObject', function() {
      it('excepts if argument not an object', function() {
        expect(function() {
          collision.addObject(1);
        }).to.throwError(function(error) {
          expect(error).to.be.a(TypeError);
          expect(error.message).to.equal('Collidable wrong type');
        });
      });
    });

    describe('#removeObject', function() {
      it('prevents an object from being collision detected', function() {
        const object = [
          new Entity(),
          new Entity(),
        ];
        sinon.stub(object[0], 'collides');
        sinon.stub(object[1], 'collides');
        object[0].addCollisionRect(7, 7);
        object[1].addCollisionRect(13, 13);
        collision.addObject(object[0]);
        collision.addObject(object[1]);
        collision.removeObject(object[1]);
        collision.detect();
        expect(object[1].collides.callCount).to.equal(0);
      });

      it('gracefully handles removal during loop', function() {
        const collision = new Collision();
        const object = [
          new Entity(),
          new Entity(),
        ];
        sinon.stub(object[0], 'collides', function(subject, ourZone, theirZone) {
          collision.removeObject(subject);
        });
        object[0].addCollisionRect(7, 7);
        object[1].addCollisionRect(13, 13);

        collision.addObject(object[0]);
        collision.addObject(object[1]);
        collision.detect();

        expect(object[0].collides.callCount).to.equal(2);
      });
    });

    describe('#setCollisionRadius', function() {
      it('should set value squared', function() {
        const collision = new Collision();
        collision.setCollisionRadius(10);
        expect(collision.collisionMaxDistanceSq).to.equal(100);
        collision.setCollisionRadius(12);
        expect(collision.collisionMaxDistanceSq).to.equal(144);
      });
    });

    describe('when objects lack collition zones added', function() {
      let object1, object2;

      beforeEach(function() {
        object1 = new Entity();
        object2 = new Entity();
        collision.addObject(object1);
        collision.addObject(object2);
        sinon.stub(object1, 'collides');
        sinon.stub(object2, 'collides');
      });

      it('nothing happens', () => {
        collision.detect();
        expect(object1.collides.callCount).to.be(0);
        expect(object2.collides.callCount).to.be(0);
      });
    });

    describe('when objects having collision zones added', () => {
      let object1, object2;

      beforeEach(function() {
        object1 = new Entity();
        object2 = new Entity();
        collision.addObject(object1);
        collision.addObject(object2);
        object1.addCollisionRect(7, 7);
        object2.addCollisionRect(13, 13);
        sinon.stub(object1, 'collides');
        sinon.stub(object2, 'collides');
        sinon.stub(object1, 'uncollides');
        sinon.stub(object2, 'uncollides');
      });

      describe('when not overlapping', () => {
        beforeEach(() => {
          object1.position.set(-100, 0, 0);
          object2.position.set(100, 0, 0);
          collision.detect();
        });

        it('does not signal collision when running', () => {
          expect(object1.collides.callCount).to.be(0);
          expect(object2.collides.callCount).to.be(0);
        });
      });

      describe('when overlapping', () => {
        beforeEach(() => {
          object1.position.set(0, 0, 0);
          object2.position.set(0, 0, 0);
          collision.detect();
        });

        it('calls collides twice on both objects', () => {
          expect(object1.collides.callCount).to.be(2);
          expect(object2.collides.callCount).to.be(2);
        });

        it('has not called .uncollides()', () => {
          expect(object1.uncollides.callCount).to.be(0);
          expect(object2.uncollides.callCount).to.be(0);
        });

        it('does not call .collides() again when positions has not changed', () => {
          collision.detect();
          expect(object1.collides.callCount).to.be(2);
          expect(object2.collides.callCount).to.be(2);
        });

        describe('Object 1 .collides() call', () => {
          it('has object 2 as argument', () => {
            expect(object1.collides.lastCall.args[0]).to.be(object2);
          });

          it('has zone from object 1', () => {
            expect(object1.collides.lastCall.args[1]).to.be(object1.collision[0]);
          });

          it('has zone from object 2', () => {
            expect(object1.collides.lastCall.args[2]).to.be(object2.collision[0]);
          });
        });

        describe('Object 2 .collides() call', () => {
          it('has object 1 as argument', () => {
            expect(object2.collides.lastCall.args[0]).to.be(object1);
          });

          it('has zone from object 1', () => {
            expect(object2.collides.lastCall.args[1]).to.be(object2.collision[0]);
          });

          it('has zone from object 2', () => {
            expect(object2.collides.lastCall.args[2]).to.be(object1.collision[0]);
          });
        });

        describe('when separating', () => {
          beforeEach(() => {
            object1.position.set(100, 0, 0);
            object2.position.set(-100, 0, 0);
            collision.detect();
          });

          it('calls .uncollides() twice on both objects', () => {
            expect(object1.uncollides.callCount).to.be(2);
            expect(object2.uncollides.callCount).to.be(2);
          });

          describe('Object 1 .uncollides() call', () => {
            it('has object 2 as argument', () => {
              expect(object1.uncollides.lastCall.args[0]).to.be(object2);
            });
          });

          describe('Object 2 .uncollides() call', () => {
            it('has object 1 as argument', () => {
              expect(object2.uncollides.lastCall.args[0]).to.be(object1);
            });
          });
        });
      });
    });
  });
});
