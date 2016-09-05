const expect = require('expect.js');
const sinon = require('sinon');

const env = require('../env');
const DeathZone = env.Engine.traits.DeathZone;
const Health = env.Engine.traits.Health;

describe('DeathZone Trait', () => {
  describe('when instantiated', () => {
    let deathZone;
    beforeEach(() => {
        deathZone = new DeathZone();
    });

    it('has NAME property "deathZone"', () => {
        expect(deathZone.NAME).to.be('deathZone');
    });

    describe('when colliding with object', () => {
      describe('lacking health property', () => {
        it('nothing blows up', () => {
            deathZone.__collides(Object.create(null));
        });
      });

      describe('having health trait', () => {
        let object;
        beforeEach(() => {
          object = {
            health: {
              energy: {
                depleted: null,
              },
              kill: sinon.spy(),
            },
          }
        });

        describe('with depleted flag set to true', () => {
          beforeEach(() => {
            object.health.energy.depleted = true;
            deathZone.__collides(object);
          });

          it('health.kill() is not called', () => {
            expect(object.health.kill.callCount).to.be(0);
          });
        });

        describe('with depleted flag set to false', () => {
          beforeEach(() => {
            object.health.energy.depleted = false;
            deathZone.__collides(object);
          });

          it('health.kill() is called', () => {
            expect(object.health.kill.callCount).to.be(1);
          });
        });
      });
    });
  });
});
