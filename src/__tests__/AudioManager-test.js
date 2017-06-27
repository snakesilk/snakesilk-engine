const expect = require('expect.js');
const sinon = require('sinon');

const AudioManager = require('../AudioManager');

describe('AudioManager', function() {
  function MockAudio() {
  }

  describe('#play()', function() {
    it('should send audio with given id to player play', function() {
      const spy = sinon.spy();
      const manager = new AudioManager;
      manager.events.bind(manager.EVENT_PLAY, spy);

      const audio = new MockAudio();
      manager.add('test', audio);
      manager.play('test');

      expect(spy.callCount).to.be(1);
      expect(spy.lastCall.args[0]).to.be(audio);
    });
  });

  describe('#stop()', function() {
    it('emits event of audio with given id', function() {
      const spy = sinon.spy();
      const manager = new AudioManager;
      manager.events.bind(manager.EVENT_STOP, spy);

      const audio = new MockAudio();
      manager.add('test', audio);
      manager.stop('test');

      expect(spy.callCount).to.be(1);
      expect(spy.lastCall.args[0]).to.be(audio);
    });
  });

  describe('#stopAll()', function() {
    it('should stop all audio from this manager', function() {
      const spy = sinon.spy();

      const manager = new AudioManager;
      manager.events.bind(manager.EVENT_STOP, spy);

      const audio = [
        new MockAudio(),
        new MockAudio(),
        new MockAudio(),
      ];
      audio.forEach((a, i) => {
        manager.add('test_' + (i + 1), audio);
      });
      manager.stopAll();
      expect(spy.callCount).to.be(3);
      audio.forEach((a, i) => {
        expect(spy.getCall(i).args[0]).to.be(audio);
      });
    });
  });
});
