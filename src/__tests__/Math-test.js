const expect = require('expect.js');

const {
  applyRatio, 
  clamp,
  circlesIntersect, 
  findRatio,
  nextPowerOf,
  rectanglesIntersect,
} = require('../Math');

describe('Math', () => {
  describe('#applyRatio()', () => {
    it('should return value for a ratio between two numbers', () => {
      expect(applyRatio(0, 0, 10)).to.be(0);
      expect(applyRatio(.25, 0, 10)).to.be(2.5);
      expect(applyRatio(.5, 0, 10)).to.be(5);
      expect(applyRatio(.75, 0, 10)).to.be(7.5);
      expect(applyRatio(1, 0, 10)).to.be(10);
      expect(applyRatio(.5, 10, 0)).to.be(5);
      expect(applyRatio(.5, 0, 20)).to.be(10);
      expect(applyRatio(.25, -20, 20)).to.be(-10);
    });
  });

  describe('#clamp()', () => {
    it('should return min value if less', () => {
      expect(clamp(4, 5, 7)).to.be(5);
    });

    it('should return max value if more', () => {
      expect(clamp(8, 5, 7)).to.be(7);
    });

    it('should return initial value if within', () => {
      expect(clamp(6, 5, 7)).to.be(6);
    });
  });

  describe('#findRatio()', () => {
    it('should return ratio between two numbers given center value', () => {
      expect(findRatio(5, 0, 10)).to.be(.5);
      expect(findRatio(5, -10, 10)).to.be(.75);
      expect(findRatio(-10, -10, 10)).to.be(0);
    });
  });

  describe('#nextPowerOf()', () => {
    it('should return the next power of 123 as 128', () => {
      expect(nextPowerOf(123)).to.be(128);
    });

    it('should return the next power of 3 as 4', () => {
      expect(nextPowerOf(3)).to.be(4);
    });

    it('should return the next power of 513 as 1024', () => {
      expect(nextPowerOf(513)).to.be(1024);
    });
  });

  describe('Geometry', () => {
    describe('#circlesIntersect()', () => {
      context('when two circles with radii 5 are 9.9 horizontal units away from each other', () => {
        it('returns true', () => {
          expect(circlesIntersect(5, 5, 0, 0, 0, 9.9)).to.be(true);
        });
      });

      context('when two circles with radii 5 are 9.9 vertical units away from each other', () => {
        it('returns true', () => {
          expect(circlesIntersect(5, 5, 0, 9.9, 0, 0)).to.be(true);
        });
      });

      context('when two circles with radii 5 are 10 horizontal units away from each other', () => {
        it('returns false', () => {
          expect(circlesIntersect(5, 5, 0, 0, 0, 10)).to.be(false);
        });
      });

      context('when two circles with radii 5 are 10 vertical units away from each other', () => {
        it('returns false', () => {
          expect(circlesIntersect(5, 5, 0, 10, 0, 0)).to.be(false);
        });
      });
    });

    describe('#rectanglesIntersect()', () => {
      context('when a rectangle sized 10x10 is at 0, 0', () => {
        context('and another rectangle 10x10 is at 9, 9', () => {
          it('returns true', () => {
            expect(rectanglesIntersect(0, 0, 10, 10, 9, 9, 10, 10)).to.be(true);
          });
        });

        context('and another rectangle 10x10 is at 10, 0', () => {
          it('returns false', () => {
            expect(rectanglesIntersect(0, 0, 10, 10, 10, 0, 10, 10)).to.be(false);
          });
        });

        context('and another rectangle 10x10 is at -10, 0', () => {
          it('returns false', () => {
            expect(rectanglesIntersect(0, 0, 10, 10, -10, 10, 10, 10)).to.be(false);
          });
        });

        context('and another rectangle 10x10 is at 0, 10', () => {
          it('returns false', () => {
            expect(rectanglesIntersect(0, 0, 10, 10, 0, 10, 10, 10)).to.be(false);
          });
        });

        context('and another rectangle 10x10 is at 0, -10', () => {
          it('returns false', () => {
            expect(rectanglesIntersect(0, 0, 10, 10, 0, -10, 10, 10)).to.be(false);
          });
        });
      });
    });
  });
});
