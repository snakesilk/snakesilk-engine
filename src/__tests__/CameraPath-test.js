const expect = require('expect.js');
const sinon = require('sinon');

const {Vector2, Vector3} = require('three');
const CameraPath = require('../CameraPath');

describe('CameraPath', function() {
  context('when instantiated', function() {
    let path;

    beforeEach(() => {
      path = new CameraPath();
    });

    it('contains windows and constraint vectors', function() {
      expect(path.constraint[0]).to.be.a(Vector3);
      expect(path.constraint[1]).to.be.a(Vector3);
      expect(path.window[0]).to.be.a(Vector2);
      expect(path.window[1]).to.be.a(Vector2);
    });

    describe('#setConstraint()', function() {
      beforeEach(() => {
        path.setConstraint(-10, -15, 10, 15);
      });

      it('should assign constraint coordinates correctly', function() {
        expect(path.constraint[0].x).to.equal(-10);
        expect(path.constraint[0].y).to.equal(-15);
        expect(path.constraint[1].x).to.equal(10);
        expect(path.constraint[1].y).to.equal(15);
      });
    });

    describe('#setWindow()', function() {
      beforeEach(() => {
        path.setWindow(-10, -15, 10, 15);
      });

      it('should assign window coordinates correctly', function() {
        expect(path.window[0].x).to.equal(-10);
        expect(path.window[0].y).to.equal(-15);
        expect(path.window[1].x).to.equal(10);
        expect(path.window[1].y).to.equal(15);
      });
    });

    describe('#constrain()', function() {
      beforeEach(() => {
        path.setConstraint(-100, -10, 100, 10);
      });

      describe('when vector inside constraint', function() {
        it('leaves vector untouched', function() {
          const vec = new Vector2(10, 5);
          path.constrain(vec);
          expect(vec.x).to.equal(10);
          expect(vec.y).to.equal(5);
        });
      });

      describe('when vector outside constraint', function() {
        it('mutates vector to fit within constraint ', function() {
          const vec = new Vector2(-200, -15);
          path.constrain(vec);
          expect(vec.x).to.equal(-100);
          expect(vec.y).to.equal(-10);
          vec.set(200, 15);
          path.constrain(vec);
          expect(vec.x).to.equal(100);
          expect(vec.y).to.equal(10);
        });
      });
    });

    describe('#inWindow()', function() {
      beforeEach(() => {
        path.setWindow(-5, -5, 5, 5);
      });

      it('returns false if any vector component outside window', function() {
        const vec = new Vector2();
        vec.set(0, 0);
        expect(path.inWindow(vec)).to.be(true);
        vec.set(-5.1, 0);
        expect(path.inWindow(vec)).to.be(false);
        vec.set(5.1, 0);
        expect(path.inWindow(vec)).to.be(false);
        vec.set(0, -5.1);
        expect(path.inWindow(vec)).to.be(false);
        vec.set(0, 5.1);
        expect(path.inWindow(vec)).to.be(false);
      });

      it('treats vectors on boundary as inside', function() {
        const vec = new Vector2();
        vec.set(-5, -5);
        expect(path.inWindow(vec)).to.be(true);
        vec.set(5, 5);
        expect(path.inWindow(vec)).to.be(true);
      });
    });
  });
});
