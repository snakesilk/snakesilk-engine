const expect = require('expect.js');
const sinon = require('sinon');

const Mocks = require('@snakesilk/testing/mocks');
const Audio = require('../Audio');
const AudioPlayer = require('../AudioPlayer');

describe('AudioPlayer', function() {
  let audioPlayer;

  beforeEach(() => {
    Mocks.AudioContext.mock();
    audioPlayer = new AudioPlayer();
  });

  afterEach(() => {
    Mocks.AudioContext.restore();
  });

  function createAudioMock()
  {
    const bufferMock = '3fa0b830-3218-11e6-b350-1040f388afa6';
    return new Audio(bufferMock);
  }

  describe('getContext()', function() {
    it('should return the AudioContext', function() {
      const context = audioPlayer.getContext();
      expect(context).to.be.a(Mocks.AudioContext.AudioContext);
    });
  });

  describe('play()', function() {
    it('should add audio to playing set', function() {
      const audio = createAudioMock();
      audioPlayer.play(audio);
      expect(audioPlayer._playing.get(audio)).to.be.a(Mocks.AudioContext.BufferSource);
    });

    it('should set playback rate on source', function() {
      audioPlayer.setPlaybackRate(1.17);
      const audio = createAudioMock();
      audioPlayer.play(audio);
      expect(audioPlayer._playing.get(audio).playbackRate.value).to.be(1.17);
    });

    it('should set audio buffer to source buffer', function() {
      const audio = createAudioMock();
      audioPlayer.play(audio);
      expect(audioPlayer._playing.get(audio).buffer).to.be('3fa0b830-3218-11e6-b350-1040f388afa6');
    });

    it('should try to stop same audio before playing again', function() {
      const audio = createAudioMock();
      audioPlayer.play(audio);
      audioPlayer.stop = sinon.spy();
      audioPlayer.play(audio);
      expect(audioPlayer.stop.getCall(0).args[0]).to.be(audio);
    });

    it('should propagate audio loop to source loop', function() {
      const audio = createAudioMock();
      audio.setLoop(1.13, 5.16);
      audioPlayer.play(audio);
      const source = audioPlayer._playing.get(audio);
      expect(source.loop).to.be(true);
      expect(source.loopStart).to.be(1.13);
      expect(source.loopEnd).to.be(5.16);
    });
  });

  describe('stop()', function() {
    it('should stop all audio if no argument given', function() {
      const audio = [
        createAudioMock(),
        createAudioMock(),
        createAudioMock(),
      ];
      audio.forEach(a => {
        audioPlayer.play(a);
      });
      const sources = [];
      audioPlayer._playing.forEach(source => {
        expect(source.stop.called).to.be(false);
        sources.push(source);
      });
      expect(sources.length).to.be(3);
      audioPlayer.stop();
      sources.forEach(source => {
        expect(source.stop.calledOnce).to.be(true);
      });
    });

    it('should stop supplied audio argument if supplied', function() {
      const audio = [
        createAudioMock(),
        createAudioMock(),
        createAudioMock(),
      ];
      audio.forEach(a => {
        audioPlayer.play(a);
      });
      const sources = [];
      audioPlayer._playing.forEach(source => {
        sources.push(source);
      });
      audioPlayer.stop(audio[1]);
      expect(sources[0].stop.called).to.be(false);
      expect(sources[1].stop.calledOnce).to.be(true);
      expect(sources[2].stop.called).to.be(false);
    });
  });

  describe('setPlaybackRate()', function() {
    it('should update playback rate for all currently playing audio', function() {
      const audio = [
        createAudioMock(),
        createAudioMock(),
        createAudioMock(),
      ];
      audio.forEach(a => {
        audioPlayer.play(a);
      });
      audioPlayer.setPlaybackRate(1.13);
      audioPlayer._playing.forEach(source => {
        expect(source.playbackRate.value).to.be(1.13);
      });
    });
  });
});
