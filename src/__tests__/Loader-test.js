const expect = require('expect.js');
const sinon = require('sinon');

const Loader = require('../Loader');
const ResourceManager = require('../ResourceManager');
const ResourceLoader = require('../ResourceLoader');

describe('Loader', function() {
  describe('after instantiation', () => {
    const MOCK_GAME = Symbol('Mock Game');
    let loader;

    beforeEach(() => {
      loader = new Loader(MOCK_GAME);
    });

    it('exposes game property', () => {
      expect(loader.game).to.be(MOCK_GAME);
    });

    it('has a ResourceManager', () => {
      expect(loader.resourceManager).to.be.a(ResourceManager);
    });

    it('has a ResourceLoader', () => {
      expect(loader.resourceLoader).to.be.a(ResourceLoader);
    });

    it('has textureScale set', () => {
      expect(loader.textureScale).to.be(1);
    });

    describe('Entity Registry', () => {
      class MyEntity{};

      beforeEach(() => {
        loader.entities.add({
          'my-entity': MyEntity,
        });
      });

      it('supports adding custom entities', () => {
        expect(loader.entities.resolve('my-entity')).to.be(MyEntity);
      });
    });

    describe('Trait Registry', () => {
      class MyTrait{};

      beforeEach(() => {
        loader.traits.add({
          'my-trait': MyTrait,
        });
      });

      it('supports adding custom traits', () => {
        expect(loader.traits.resolve('my-trait')).to.be(MyTrait);
      });
    })
  });
});

