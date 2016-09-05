const expect = require('expect.js');
const sinon = require('sinon');

const env = require('../env');
const Vector3 = env.THREE.Vector3;
const Attach = env.Engine.traits.Attach;
const Solid = env.Engine.traits.Solid;

describe('Attach Trait', () => {
  describe('when instantiated', () => {
    let attach;
    beforeEach(() => {
        attach = new Attach();
        sinon.stub(attach, '_trigger');
    });

    it('has NAME property "attach"', () => {
        expect(attach.NAME).to.be('attach');
    });

    it('has EVENT_ATTACH constant equalling "attach"', () => {
        expect(attach.EVENT_ATTACH).to.be('attach');
    });

    describe('when unattached', () => {
      describe('and timeshifted', () => {
        it('nothing happens', () => {
          attach.__timeshift(.1);
        });
      });
    });

    describe('when colliding', () => {
      describe('with object lacking solid property', () => {
        it('nothing happens', () => {
          attach.__collides(Object.create(null));
        });
      });

      describe('with object having solid trait', () => {
        let object;
        beforeEach(() => {
          attach._host = {
            position: new Vector3(13, 17, 0),
            velocity: new Vector3(19, 23, 0),
            collidable: true,
          }

          object = {
            position: new Vector3(37, 43, 0),
            solid: new Solid,
          }
        });

        describe('and colliding left to right', () => {
          beforeEach(() => {
            sinon.stub(object.solid, 'attackDirection', object.solid.attackDirection);
            attach.__collides(object,
              {top: 0, bottom: 10, left: 0, right: 10},
              {top: 0, bottom: 10, left: -10, right: 0});
          });

          it('operates with expected direction', () => {
            expect(object.solid.attackDirection.getCall(0).returnValue)
              .to.be(Solid.SIDES.LEFT);
          });

          it('sets host velocity to 0', () => {
            expect(attach._host.velocity).to.eql({x: 0, y: 0, z: 0});
          });

          it('sets host collidability to false', () => {
            expect(attach._host.collidable).to.be(false);
          });

          it('triggers an attach event', () => {
            expect(attach._trigger.callCount).to.be(1);
            expect(attach._trigger.lastCall.args[0]).to.be('attach');
            expect(attach._trigger.lastCall.args[1][0]).to.be(object);
          });

          describe('and object moves', () => {
            beforeEach(() => {
              object.position.x += 11;
              object.position.y += 13;
              object.position.z += 17;
            });

            describe('and time passes', () => {
              beforeEach(() => {
                attach.__timeshift(1);
              });

              it('host follow attached object', () => {
                expect(attach._host.position).to.eql({x: 24, y: 30, z: 17});
              });
            });

            describe('and reset() is called', () => {
              beforeEach(() => {
                attach.reset();
              });

              describe('and time passes', () => {
                beforeEach(() => {
                  attach.__timeshift(1);
                });

                it('host ignores object movement', () => {
                  expect(attach._host.position).to.eql({x: 13, y: 17, z: 0});
                });
              });
            });
          });
        });

        describe('and colliding right to left', () => {
          beforeEach(() => {
            sinon.stub(object.solid, 'attackDirection', object.solid.attackDirection);
            attach.__collides(object,
              {top: 0, bottom: 10, left: -0, right: 0},
              {top: 0, bottom: 10, left: 0, right: 10});
          });

          it('operates with expected direction', () => {
            expect(object.solid.attackDirection.getCall(0).returnValue)
              .to.be(Solid.SIDES.RIGHT);
          });

          it('sets host velocity to 0', () => {
            expect(attach._host.velocity).to.eql({x: 0, y: 0, z: 0});
          });

          it('sets host collidability to false', () => {
            expect(attach._host.collidable).to.be(false);
          });

          it('triggers an attach event', () => {
            expect(attach._trigger.callCount).to.be(1);
            expect(attach._trigger.lastCall.args[0]).to.be('attach');
            expect(attach._trigger.lastCall.args[1][0]).to.be(object);
          });

          describe('and object moves', () => {
            beforeEach(() => {
              object.position.x += 11;
              object.position.y += 13;
              object.position.z += 17;
            });

            describe('and time passes', () => {
              beforeEach(() => {
                attach.__timeshift(1);
              });

              it('host follow attached object', () => {
                expect(attach._host.position).to.eql({x: 24, y: 30, z: 17});
              });
            });

            describe('and reset() is called', () => {
              beforeEach(() => {
                attach.reset();
              });

              describe('and time passes', () => {
                beforeEach(() => {
                  attach.__timeshift(1);
                });

                it('host ignores object movement', () => {
                  expect(attach._host.position).to.eql({x: 13, y: 17, z: 0});
                });
              });
            });
          });
        });

        describe('and colliding top to bottom to right', () => {
          let ourZone, theirZone;
          beforeEach(() => {
            ourZone = {top: 0, bottom: 10, left: 0, right: 10};
            theirZone = {top: -10, bottom: -1, left: 0, right: 10}
            sinon.stub(object.solid, 'attackDirection', object.solid.attackDirection);
            attach.__collides(object, ourZone, theirZone);

          });

          it('operates with expected direction', () => {
            expect(object.solid.attackDirection.getCall(0).returnValue)
              .to.be(Solid.SIDES.TOP);
          });

          it('does not change velocity', () => {
            expect(attach._host.velocity).to.eql({x: 19, y: 23, z: 0});
          });

          it('does not change host collidability', () => {
            expect(attach._host.collidable).to.be(true);
          });

          it('triggers no attach event', () => {
            expect(attach._trigger.callCount).to.be(0);
          });

          it('nudges colliding zone', () => {
            expect(ourZone.top).to.be(theirZone.bottom);
          });
        });

        describe('and colliding bottom to top', () => {
          let ourZone, theirZone;
          beforeEach(() => {
            ourZone = {top: -10, bottom: 1, left: 0, right: 10}
            theirZone = {top: 0, bottom: 10, left: 0, right: 10}
            sinon.stub(object.solid, 'attackDirection', object.solid.attackDirection);
            attach.__collides(object, ourZone, theirZone);
          });

          it('operates with expected direction', () => {
            expect(object.solid.attackDirection.getCall(0).returnValue)
              .to.be(Solid.SIDES.BOTTOM);
          });

          it('does not change velocity', () => {
            expect(attach._host.velocity).to.eql({x: 19, y: 23, z: 0});
          });

          it('does not change host collidability', () => {
            expect(attach._host.collidable).to.be(true);
          });

          it('triggers no attach event', () => {
            expect(attach._trigger.callCount).to.be(0);
          });

          it('nudges colliding zone', () => {
            expect(ourZone.bottom).to.be(theirZone.top);
          });
        });
      });
    });
  });
});
