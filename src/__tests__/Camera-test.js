const expect = require('expect.js');
const sinon = require('sinon');

const THREE = require('three');
const Camera = require('../Camera');
const CameraPath = require('../CameraPath');

describe('Camera', function() {
  it('exposes CameraPath on Path property', () => {
    expect(Camera.Path).to.be(CameraPath);
  });

  describe('when instantiated', function() {
    let camera;

    beforeEach(function() {
      camera = new Camera();
    });

    it('reference real camera position', function() {
      expect(camera.position).to.be(camera.camera.position);
    });

    it('have real camera as property', function() {
      expect(camera.camera).to.be.a(THREE.Camera);
    });

    it('has no path selected', function() {
      expect(camera.pathIndex).to.equal(-1);
    });

    it('has no paths', function() {
      expect(camera.paths).to.be.an(Array);
      expect(camera.paths).to.have.length(0);
    });

    describe('#addPath()', function() {
      it('should add a path to path array', function() {
        const path = new CameraPath();
        camera.addPath(path);
        expect(camera.paths).to.have.length(1);
        expect(camera.paths[0]).to.be(path);
      });

      it('should except if argument not a path', function() {
        expect(function() {
          camera.addPath('foo');
        }).to.throwError(function(error) {
          expect(error).to.be.an(TypeError);
          expect(error.message).to.equal('Invalid camera path');
        });
      });
    });

    describe('#follow()', function() {
      let mockObject;

      beforeEach(function() {
        mockObject = {
          position: new THREE.Vector3(),
        };
      });

      it('sets desiredPosition with default offset', function() {
        mockObject.position.set(7, 13);
        camera.followOffset.set(13, 14);
        camera.follow(mockObject)
        expect(camera.desiredPosition.x).to.equal(7);
        expect(camera.desiredPosition.y).to.equal(13);
        expect(camera.followOffset.x).to.equal(0);
        expect(camera.followOffset.y).to.equal(0);
      });

      it('sets desiredPosition and honor offset', function() {
        mockObject.position.set(7, 13);
        camera.follow(mockObject, new THREE.Vector3(13, 7, 19))
        expect(camera.desiredPosition.x).to.equal(7);
        expect(camera.desiredPosition.y).to.equal(13);
        expect(camera.followOffset.x).to.equal(13);
        expect(camera.followOffset.y).to.equal(7);
      });

      it('sets followObject property', function() {
        camera.follow(mockObject),
        expect(camera.followObject).to.be(mockObject);
      });
    });

    describe('#findPath()', function() {
      beforeEach(() => {
        const path = [
          new CameraPath(),
          new CameraPath(),
        ];
        // First square window
        path[0].setWindow(0, 0, 100, 100);
        // Wider window overlapping previous
        path[1].setWindow(0, 0, 200, 100);
        camera.addPath(path[0]);
        camera.addPath(path[1]);
      });

      describe('when no path selected', function() {
        beforeEach(() => {
          camera.findPath({x: 10, y: 10});
        });

        it('sets the pathIndex to first matching window', function() {
          expect(camera.pathIndex).to.equal(0);
        });

        describe('when outside currently picked', function() {
          beforeEach(() => {
            camera.findPath({x: 110, y: 10});
          });

          it('finds next suitable window', function() {
            expect(camera.pathIndex).to.equal(1);
          });

          describe('when inside overlapping', function() {
            beforeEach(() => {
              camera.findPath({x: 10, y: 10});
            });

            it('should not pick another window until leaving current', function() {
              expect(camera.pathIndex).to.equal(1);
            });

            describe('when outside all windows', function() {
              it('keeps current pick', function() {
                camera.findPath({x: -10, y: -10});
                expect(camera.pathIndex).to.equal(1);
              });
            });
          });
        });
      });
    });

    describe('#jumpTo()', function() {
      it('sets camera position to vector', function() {
        camera.jumpTo({x: 7, y: 13, z: 19});
        expect(camera.position.x).to.equal(7);
        expect(camera.position.y).to.equal(13);
        expect(camera.position.z).to.equal(19);
      });

      it('ignores missing z from vector', function() {
        camera.position.z = 19;
        camera.jumpTo({x: 13, y: 7});
        expect(camera.position.x).to.equal(13);
        expect(camera.position.y).to.equal(7);
        expect(camera.position.z).to.equal(19);
      });
    });

    describe('#jumpToPath()', function() {
      it('sets camera position to vector and constrains it to path', function() {
        const path = new CameraPath();
        camera.addPath(path);
        path.setConstraint(5, 7, 15, 17);
        camera.jumpToPath(new THREE.Vector2(0, 0));
        expect(camera.position.x).to.equal(5);
        expect(camera.position.y).to.equal(7);
      });
    });

    describe('#panTo()', function() {
      it('pans camera using supplied easing function', function() {
        const from = new THREE.Vector3(0, 0, 0);
        const to = new THREE.Vector3(300, 200, 100);
        camera.jumpTo(from);
        const easingSpy = sinon.spy(progress => {
          return progress;
        });
        camera.panTo(to, 7, easingSpy);
        expect(camera.position).to.eql({x: 0, y: 0, z: 0});
        camera.updateTime(3);
        expect(easingSpy.getCall(0).args).to.eql([3/7]);
        expect(camera.position).to.eql({
          x: 128.57142857142856,
          y: 85.71428571428571,
          z: 42.857142857142854
        });
        camera.updateTime(4);
        expect(easingSpy.getCall(1).args).to.eql([1]);
        expect(camera.position).to.eql(to);
      });

      it('should return a promise that resolves when destination reached', function(done) {
        camera.panTo(new THREE.Vector2(10, 20, 30), 2).then(() => {
          done();
        });
        camera.updateTime(2);
      });

      it('should use current z when supplied with vector 2', function() {
        camera.position.z = 13;
        const to = new THREE.Vector2(300, 200);
        camera.panTo(to, 1);
        camera.updateTime(1);
        expect(camera.position).to.eql({x:300, y:200, z:13});
      });
    });

    describe('#updateTime()', function() {
      it('sets velocity based on distance to desiredPosition', function() {
        const from = new THREE.Vector3(0, 0, 0);
        const to = new THREE.Vector3(300, 200, 0);
        camera.position.copy(from);
        camera.desiredPosition = to.clone();
        camera.updateTime(.016);
        expect(camera.velocity.x).to.equal(15);
        expect(camera.velocity.y).to.equal(10);
        camera.updateTime(.016);
        expect(camera.velocity.x).to.equal(14.25);
        expect(camera.velocity.y).to.equal(9.5);
      });
    });
  });
});
