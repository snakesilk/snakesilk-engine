const expect = require('expect.js');
const sinon = require('sinon');

const {readOnly} = require('../Util');

describe('Util', function() {
    describe('#readOnly', () => {
        let object;

        describe('when adding property without removable flag', () => {
            beforeEach(() => {
                object = {};
                readOnly(object, {
                    'test': new Map(),
                });
            });

            it('creates a read-only property on an object', () => {
                object.test.set('foo', 'bar');
                object.test = {};
                expect(object.test.get('foo')).to.be('bar');
            });

            it('is not removable', () => {
                delete object.test;
                expect(object.hasOwnProperty('test')).to.be(true);
            });
        });

        describe('when adding property with configurable', () => {
            beforeEach(() => {
                object = {};
                readOnly(object, {
                    'test': new Map(),
                }, true);
            });

            it('is removable', () => {
                delete object.test;
                expect(object.hasOwnProperty('test')).to.be(false);
            });
        });
    });
});
