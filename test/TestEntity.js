const {assert} = require('chai');
const Web3 = require('web3');
const Entity = require("../src/entity.js");
const FakeProvider = require('web3-fake-provider');
const Utils = require("../src/utils.js");


describe('Class: Entity', function () {

     describe('3.1 constructor()', function () {

        it('3.1.1 check default values of all attributes', function () {
            const entity = new Entity();
            assert.equal(entity.events.length, 0);
            assert.equal(entity.currentBlock, 0);
            assert.equal(entity.highestBlock, 0);
            assert.isFalse(entity.connectionWorking);
            assert.equal(entity.connectionMessage, "Not connected");
        });
    });

    describe('3.2 init()', function () {

        it('3.2.1 check default values of all attributes', function () {
            const entity = new Entity();
            entity.init('http://127.0.0.1:8545');
            assert.isNotNull(entity.web3);
        });
    });

    describe("3.3 init('http://127.0.0.1:8545')", function () {

        const entity = new Entity();
        entity.init('http://127.0.0.1:8545');

        it('3.3.1 connection is working', function () {
            assert.equal(entity.isConnectionWorking(), true);
            assert.equal(entity.connectionMessage, 'Connected');
        });

        it('3.3.2 block number larger than zero', function () {
            return entity.web3.eth.getBlockNumber().then(blockNumber => {
                console.log('        blockNumber => ' + blockNumber);
                assert(blockNumber > 0);
            });
        });
    });

    describe("3.4 init('ws://127.0.0.1:8545')", function () {

        const entity = new Entity();
        entity.init('ws://127.0.0.1:8545');

        it('3.4.1 connection is working', function () {
            assert.equal(entity.isConnectionWorking(), true);
            assert.equal(entity.connectionMessage, 'Connected');
        });

        it('3.4.2 block number larger than zero', function () {
            return entity.web3.eth.getBlockNumber().then(blockNumber => {
                console.log('        blockNumber => ' + blockNumber);
                assert(blockNumber > 0);
            });
        });
    });

    describe("3.5 init('wrong') expects no connection", function () {

        const entity = new Entity();
        entity.init('wrong');

        it('3.5.1 connection is working', function () {
            assert.equal(false, entity.isConnectionWorking());
            assert.equal('Not connected', entity.connectionMessage);
        });

    });

    describe("3.6 init('http://127.0.0.1:8545')", function () {

        const entity = new Entity();
        const web3Candidate = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545', 1));
        entity.setWeb3(web3Candidate);

        it('3.6.1 connection is working', function () {
            assert.equal(entity.isConnectionWorking(), true);
            assert.equal(entity.connectionMessage, 'Connected');
        });

        it('3.6.2 block number larger than zero', function () {
            return entity.web3.eth.getBlockNumber().then(blockNumber => {
                console.log('        blockNumber => ' + blockNumber);
                assert(blockNumber > 0);
            });
        });
    });

    describe('3.7 isSyncing()', function () {

        // testing isSyncing() is not possible with ganache-cli
        const fake_provider = new FakeProvider();
        const fake_entity = new Entity();
        fake_entity.web3 = new Web3(fake_provider);
        fake_provider.injectResult({startingBlock: '0x384', currentBlock: '0x386', highestBlock: '0x454'});
        fake_provider.injectValidation(function (payload) {
            assert.equal(payload.jsonrpc, '2.0');
            assert.equal(payload.method, 'eth_syncing');
            assert.deepEqual(payload.params, []);
        });
        fake_entity.isSyncing();

        it('3.7.1 check block numbers', function () {
            console.log("        fake_entity.highestBlock > " + fake_entity.highestBlock );
            console.log("        fake_entity.currentBlock > " + fake_entity.currentBlock );
            assert.isTrue(fake_entity.highestBlock > fake_entity.currentBlock );
        });

        it('3.7.2 check syncing status', function () {
            assert.isTrue(fake_entity.isSyncing() );
        });

        it('3.7.3 check syncing status with invalid provider', function () {
            const null_entity = new Entity();
            null_entity.web3 = null;
            assert.isFalse(null_entity.isSyncing() );
        });

    });

    describe('3.8 isConnectionWorking()', function () {

        // testing isListening() is not possible with ganache-cli
        const fake_provider = new FakeProvider();
        const fake_entity = new Entity();
        fake_entity.web3 = new Web3(fake_provider);
        fake_provider.injectError("ABC");
        fake_provider.injectValidation(function (payload) {
            assert.equal(payload.jsonrpc, '2.0');
            assert.equal(payload.method, 'net_listening');
            assert.deepEqual(payload.params, []);
        });

        it('3.8.1 check working status with no connection', function () {
            fake_entity.isConnectionWorking();
            assert.isFalse(fake_entity.connectionWorking);
            assert.equal('Not connected', fake_entity.connectionMessage);
        });

    });


});
