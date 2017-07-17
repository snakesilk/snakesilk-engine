const expect = require('expect.js');
const sinon = require('sinon');

const {readOnly} = require('../Util');

describe('Util', function() {
    describe('#readOnly', () => {
        it('creates a read-only property on an object', () => {
            const object = {};
            readOnly(object, {
                'test': new Map(),
            });

            object.test.set('foo', 'bar');
            object.test = {};
            expect(object.test.get('foo')).to.be('bar');
        });
    });
});
