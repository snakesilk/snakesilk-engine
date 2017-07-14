const expect = require('expect.js');
const sinon = require('sinon');

const ResourceManager = require('../ResourceManager');

describe('ResourceManager', function() {
  describe('after instantiation', () => {
    let resource;

    beforeEach(() => {
      resource = new ResourceManager();
    });

    it('answers false when asking if an item exist that does not', () => {
      expect(resource.has('entity', 'my-entity-id')).to.be(false);
    });

    it('throws an error when asking for item that does not exist', () => {
      expect(() => {
        resource.get('entity', 'my-id');
      }).to.throwError(error => {
        expect(error).to.be.an(Error);
        expect(error.message).to.be('No resource "my-id" of type entity.');
      });
    });

    describe('when item added', () => {
      const MOCK_ENTITY = Symbol('mock entity');

      beforeEach(() => {
        resource.addEntity('my-entity-id', MOCK_ENTITY);
      });

      it('answers true when asked if item exists', () => {
        expect(resource.has('entity', 'my-entity-id')).to.be(true);
      });

      it('returns item', () => {
        expect(resource.get('entity', 'my-entity-id')).to.be(MOCK_ENTITY);
      });

      it('throws an error if trying to overwrite object', () => {
        expect(() => {
          resource.addEntity('my-entity-id', undefined);
        }).to.throwError(error => {
          expect(error).to.be.an(Error);
          expect(error.message).to.be('Resource "my-entity-id" of type entity already defined.');
        });
      });
    });

    [
      ['addAudio', 'audio'],
      ['addFont', 'font'],
      ['addEntity', 'entity'],
      ['addTexture', 'texture'],
    ].forEach(([methodName, typeName]) => {
      describe(`when adding item using #${methodName}`, () => {
        const ID = 'my-item-id';
        const MOCK_ENTITY = Symbol('mock entity');

        beforeEach(() => {
          resource[methodName](ID, MOCK_ENTITY);
        });

        it(`can be retrieved with type "${typeName}"`, () => {
          expect(resource.get(typeName, ID)).to.be(MOCK_ENTITY);
        });
      });
    });
  });
});
