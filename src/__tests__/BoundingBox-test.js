const expect = require('expect.js');

const {Vector2, Vector3} = require('three');
const BoundingBox = require('../BoundingBox');

describe('BoundingBox', function() {
  let box, pos;

  beforeEach(() => {
    pos = new Vector3();
    box = new BoundingBox(pos, new Vector2(5, 7), new Vector2(1, -1));
  });

  it('has x and y', function() {
    expect(box.x).to.equal(1);
    expect(box.y).to.equal(-1);
  });

  it('has width and height', function() {
    expect(box.width).to.equal(5);
    expect(box.height).to.equal(7);
  });

  it('provides absolute left, right, top, bottom', function() {
    expect(box.left).to.equal(-1.5);
    expect(box.right).to.equal(3.5);
    expect(box.top).to.equal(2.5);
    expect(box.bottom).to.equal(-4.5);
  });

  it('updates automatically if initial position changes', function() {
    pos.x += 8;
    pos.y += 4;
    expect(box.x).to.equal(9);
    expect(box.y).to.equal(3);
    expect(box.left).to.equal(6.5);
    expect(box.right).to.equal(11.5);
    expect(box.top).to.equal(6.5);
    expect(box.bottom).to.equal(-0.5);
  });

  it('updates position if values set', function() {
    box.top = 0;
    box.left = 0;
    expect(pos.x).to.equal(1.5);
    expect(pos.y).to.equal(-2.5);
    box.bottom = 0;
    box.right = 0;
    expect(pos.x).to.equal(-3.5);
    expect(pos.y).to.equal(4.5);
  });
});
