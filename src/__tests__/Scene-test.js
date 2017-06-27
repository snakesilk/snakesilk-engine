const expect = require('expect.js');
const sinon = require('sinon');

const Scene = require('../Scene');

describe('Scene', function() {
  let scene;
  beforeEach(() => {
    scene = new Scene();
  });

  describe('#doFor()', function() {
    it('should call callback for every simulation step for entire duration and supply elapsed time and progress fraction', function() {
      const callbackSpy = sinon.spy();
      scene.doFor(2, callbackSpy);
      scene.world.updateTime(1);
      expect(callbackSpy.callCount).to.be(120);
      expect(callbackSpy.getCall(0).args).to.eql([scene.world.timeStep, 0.004166666666666667]);
      expect(callbackSpy.getCall(12).args[0]).to.be(0.10833333333333332);
      scene.world.updateTime(2);
      expect(callbackSpy.lastCall.args).to.eql([2.008333333333329, 1]);
    });

    it('should return a promise that resolves when done', function(done) {
      const callbackSpy = sinon.spy();
      scene.doFor(2, callbackSpy).then(time => {
        done();
      });
      scene.world.updateTime(2.1);
    });
  });

  describe('#waitFor()', function() {
    it('should return a promise that resolves when duration elapsed', function(done) {
      const callbackSpy = sinon.spy();
      scene.waitFor(2).then(time => {
        expect(time.elapsed).to.be(2.008333333333329);
        done();
      });
      scene.world.updateTime(3);
    });
  });

  describe('#updateTime', () => {
    describe('when running', () => {
      beforeEach(() => {
        scene.resumeSimulation();
      });

      it('propagates given time to world', () => {
        sinon.stub(scene.world, 'updateTime');
        scene.updateTime(1.2314);
        expect(scene.world.updateTime.callCount).to.be(1);
        expect(scene.world.updateTime.lastCall.args[0]).to.be(1.2314);
      });

      it('propagates given time to camera', () => {
        sinon.stub(scene.camera, 'updateTime');
        scene.updateTime(1.2314);
        expect(scene.camera.updateTime.callCount).to.be(1);
        expect(scene.camera.updateTime.lastCall.args[0]).to.be(1.2314);
      });
    });

    describe('when paused', () => {
      beforeEach(() => {
        scene.pauseSimulation();
      });

      it('does not propagate given time to world', () => {
        sinon.stub(scene.world, 'updateTime');
        scene.updateTime(1.2314);
        expect(scene.world.updateTime.callCount).to.be(0);
      });

      it('propagates given time to camera', () => {
        sinon.stub(scene.camera, 'updateTime');
        scene.updateTime(1.2314);
        expect(scene.camera.updateTime.callCount).to.be(0);
      });
    });
  });
});
