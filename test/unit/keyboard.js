'use strict';

const expect = require('expect.js');
const sinon = require('sinon');

const env = require('../env');
const Keyboard = env.Engine.Input.Keyboard;

describe('Keyboard', function() {
  describe('#assign()', function() {
    it('should allow multiple keys to be assigned to same event', function() {
      const input = new Keyboard();
      input.assign(1, 'A');
      input.assign(2, 'A');
      const spy = sinon.spy();
      input.events.bind(input.EVENT_TRIGGER, spy);
      input.handleEvent({keyCode: 1, type: 'keydown'});
      expect(spy.callCount).to.be(1);
      expect(spy.lastCall.args).to.eql(['A', 'keydown']);
      input.handleEvent({keyCode: 1, type: 'keyup'});
      expect(spy.callCount).to.be(2);
      expect(spy.lastCall.args).to.eql(['A', 'keyup']);
      input.handleEvent({keyCode: 2, type: 'keydown'});
      expect(spy.lastCall.args).to.eql(['A', 'keydown']);
      expect(spy.callCount).to.be(3);
    });
  });

  describe('#unassign()', function() {
    it('should delete key mappings', function() {
      const input = new Keyboard();
      input.assign(1, 'A');
      input.assign(2, 'A');
      const spy = sinon.spy();
      input.events.bind(input.EVENT_TRIGGER, spy);
      input.unassign(2);
      input.handleEvent({keyCode: 2, type: 'keydown'});
      expect(spy.callCount).to.be(0);
    });
  });

  describe('#release()', function() {
    it('should trigger release event on all keys', function() {
      const input = new Keyboard();

      const spies = {};

      for (let code in input.map) {
        const name = input.map[code];
        spies[name] = {
          on: sinon.spy(),
          off: sinon.spy(),
        };
        input.intermittent(name, spies[name].on, spies[name].off);
        input.trigger(name, input.ENGAGE);
      }

      for (let code in input.map) {
        const name = input.map[code];
        expect(spies[name].on.callCount).to.equal(1);
      }

      input.release();

      for (let code in input.map) {
        const name = input.map[code];
        expect(spies[name].on.callCount).to.equal(1);
        expect(spies[name].off.callCount).to.equal(1);
      }
    });
  });

  describe('#handleEvent()', function() {
    context('when matching bound key', function() {
      it('should call preventDefault() on event', function() {
        const input = new Keyboard();
        input.assign(2, 'A');
        const mockEvent = {
          keyCode: 2,
          preventDefault: sinon.spy(),
          type: 'keydown',
        };
        input.handleEvent(mockEvent);
        expect(mockEvent.preventDefault.callCount).to.equal(1);
        expect(mockEvent.preventDefault.lastCall.args).to.have.length(0);
      });

      it('calls trigger with mapped key', function() {
        const input = new Keyboard();
        input.assign(2, 'UP');
        input.trigger = sinon.spy();
        const mockEvent = {
          keyCode: 2,
          preventDefault: sinon.spy(),
          type: 'keydown',
        };
        input.handleEvent(mockEvent);
        expect(input.trigger.callCount).to.be(1);
        expect(input.trigger.lastCall.args).to.eql(['UP', 'keydown']);
      });
    });

    context('when not matching bound key', function() {
      it('should not call preventDefault on event', function() {
        const input = new Keyboard();
        input.trigger = sinon.spy();
        const mockEvent = {
          keyCode: 2,
          preventDefault: sinon.spy(),
          type: 'keydown',
        };
        input.handleEvent(mockEvent);
        expect(mockEvent.preventDefault.callCount).to.equal(0);
      });
    });
  });

  describe('#exportMap()', function() {
    it('should return current map as object', function() {
      const input = new Keyboard();
      input.importMap({});
      input.assign(1, 'LEFT');
      input.assign(2, 'RIGHT');
      expect(input.exportMap()).to.eql({'1': 'LEFT', '2': 'RIGHT'});
      input.assign(123, 'UP');
      expect(input.exportMap()).to.eql({'1': 'LEFT', '2': 'RIGHT', '123': 'UP'});
      input.unassign(1);
      expect(input.exportMap()).to.eql({'2': 'RIGHT', '123': 'UP'});
    });
  });

  describe('#importMap()', function() {
    it('should set and overwrite current map', function() {
      const input = new Keyboard();
      const triggerSpy = sinon.spy();
      input.events.bind(input.EVENT_TRIGGER, triggerSpy);
      input.importMap({'1': 'left', '123': 'up'});
      input.handleEvent({keyCode: 1, type: 'keydown'});
      expect(triggerSpy.callCount).to.be(1);
      expect(triggerSpy.lastCall.args).to.eql(['left', 'keydown']);
      input.handleEvent({keyCode: 123, type: 'keydown'});
      expect(triggerSpy.callCount).to.be(2);
      expect(triggerSpy.lastCall.args).to.eql(['up', 'keydown']);
      input.importMap({'13': 'down'});
      input.handleEvent({keyCode: 123, type: 'keydown'});
      expect(triggerSpy.callCount).to.be(2);
    });
  });

  describe('#trigger()', function() {
    it('fires event', function() {
      const input = new Keyboard();
      const spy = sinon.spy();
      input.events.bind(input.EVENT_TRIGGER, spy);
      input.trigger('UP', true);
      expect(spy.callCount).to.be(1);
      expect(spy.lastCall.args).to.eql(['UP', true]);
    });

    it('keeps track of state', function() {
      const input = new Keyboard();
      const spy = sinon.spy();
      input.events.bind(input.EVENT_TRIGGER, spy);
      input.trigger('UP', true);
      expect(spy.callCount).to.be(1);
      expect(spy.lastCall.args).to.eql(['UP', true]);
      input.trigger('UP', true);
      input.trigger('UP', true);
      input.trigger('UP', true);
      expect(spy.callCount).to.be(1);
      input.trigger('UP', false);
      expect(spy.callCount).to.be(2);
      expect(spy.lastCall.args).to.eql(['UP', false]);
    });
  });
});
