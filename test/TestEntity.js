const { assert } = require('chai');
const Entity = require("../src/entity.js");

describe('Class: Entity', function () {

    describe('constructor()', function () {

        it('check default values of all attributes', function () {
            const entity = new Entity();
            assert.equal(entity.events.length, 0);
            assert.equal(entity.currentBlock, 0);
            assert.equal(entity.highestBlock, 0);
            assert.isFalse(entity.syncing);
            assert.isFalse(entity.connectionWorking);
            assert.equal(entity.connectionMessage, "Not connected");
        });
    });

    describe('init()', function () {

        it('check default values of all attributes', function () {
            const entity = new Entity();
            entity.init('http://127.0.0.1:8545');
            assert.isNotNull(entity.web3);
        });
    });

    describe("valid provider in init('http://127.0.0.1:8545')", function () {
        const entity = new Entity();
        entity.init('http://127.0.0.1:8545');

        it('connection is working', function () {
            assert.equal(entity.isConnectionWorking(), true);
            assert.equal(entity.connectionMessage, 'Connected');
        });

        it('block number larger than zero', function () {
            return entity.web3.eth.getBlockNumber().then(blockNumber => {
                console.log('        blockNumber => ' + blockNumber);
                assert(blockNumber > 0);
            });
        });
    });

});
