const {assert} = require('chai');
const Utils = require("../src/utils.js");
const Entity = require("../src/entity.js");
const Control = require("../src/control.js");

let control = {};

describe('Class: Control', function () {

    describe('2.1 constructor()', function () {

        it('2.1.1 check runLoadTable should give events after 1 second', function () {
            const url = 'http://localhost:55226/main.html?contract=' + global.CONTRACT_ADDRESS + '&provider=http://127.0.0.1:8545'
            const control_02 = new Control(new Entity(), (value) => {
                console.log("        progress [%] => " + value)
            }, url);
            control_02.runLoadTable();
            return Utils.sleep(1100).then(() => {
                    assert.equal(control_02.entity.events.length, 0);
                }
            )
        });

        it('2.1.2 check default values of attributes with invalid abi', function () {
            const url1 = 'http://localhost:55226/main.html?abi=eJyLrowFAAJjATI%3D&contract=' + global.CONTRACT_ADDRESS;
            const control_03 = new Control(new Entity(), (value) => {
            }, url1);
            control_03.runLoadTable();
            return Utils.sleep(1100).then(() => {
                    assert.equal(control_03.entity.events.length, 0);
                }
            )
        });

        it('2.1.3 check default values of attributes', function () {
            console.log('        contract => ' + global.CONTRACT_ADDRESS);
            const url = 'http://localhost:55226/main.html?abi=eJylkjFPxDAMhf%2BL504Ibuh6rGxspw6%2B1FdFap0qse%2BoTv3vJNBrQkGAYEz8%2FN5ny4crWB5VAtSHpoIRJzz2BPUJ%2B0AVBEGhJxU82t7KBDWw45uoApnGqAXjOIhXI87DXF0Bo2ganIbVZ81IcS29UFuUhDxj%2F%2FzuhW3rKYRozjikD3dh8jnrVk85P1hFJstddhpiH3YF9yKYm1Wyz5M8Oi6kdCaWfw%2Bn8b27z0TGaXRdQ5byBx5NDl9xvC0d46OOwCVF7u5I9kuCUykgP0HdPey%2BpUr1%2BVf3cbZ0yb0nZSPW8YZ4u7iMbNl4GmjD%2FOfLzPnNKxMgAfs%3D&contract=' + global.CONTRACT_ADDRESS + '&provider=http://127.0.0.1:8545'
            const control_04 = new Control(new Entity(), (value) => {
                console.log("        progress [%] => " + value)
            }, url);
            assert.equal('', control_04.trxNumber);
            assert.equal('', control_04.blockNumber, '');
            assert.equal(global.CONTRACT_ADDRESS, control_04.contractAddress);
            assert.equal('localhost:55226', control_04.serverHost);
            assert.equal('latest', control_04.eventsBlockTo,);
            assert.equal('', control_04.eventsBlockFrom);
            assert.equal('', control_04.eventsBlockFromInitial);
            assert.isFalse(control_04.getEventsSucceeded);
            assert.equal(100, control_04.getEventsProgress);
        });


        it('2.1.4 check default values of attributes empty url', function () {
            const url = 'http://localhost:55226/main.html';
            const control_05 = new Control(new Entity(), (value) => {
            }, url);
            assert.equal('', control_05.trxNumber);
            assert.equal('', control_05.blockNumber, '');
            assert.equal('', control_05.contractAddress);
            assert.equal('localhost:55226', control_05.serverHost);
            assert.equal('latest', control_05.eventsBlockTo,);
            assert.equal(0, control_05.eventsBlockFrom);
            assert.equal('', control_05.eventsBlockFromInitial);
            assert.isFalse(control_05.getEventsSucceeded);
            assert.equal(100, control_05.getEventsProgress);
        });

        it('2.1.5 check url parameter start and stop', function () {
            const url1 = 'http://localhost:55226/main.html?start=12345&stop=54321';
            const control_06 = new Control(new Entity(), (value) => {
            }, url1);
            assert.equal(54321, control_06.eventsBlockTo);
            assert.equal(12345, control_06.eventsBlockFrom);
        });

        it('2.1.6 check runLoadTable should give events after 1 second', function () {
            const url = 'http://localhost:55226/main.html?abi=eJylkjFPxDAMhf%2BL504Ibuh6rGxspw6%2B1FdFap0qse%2BoTv3vJNBrQkGAYEz8%2FN5ny4crWB5VAtSHpoIRJzz2BPUJ%2B0AVBEGhJxU82t7KBDWw45uoApnGqAXjOIhXI87DXF0Bo2ganIbVZ81IcS29UFuUhDxj%2F%2FzuhW3rKYRozjikD3dh8jnrVk85P1hFJstddhpiH3YF9yKYm1Wyz5M8Oi6kdCaWfw%2Bn8b27z0TGaXRdQ5byBx5NDl9xvC0d46OOwCVF7u5I9kuCUykgP0HdPey%2BpUr1%2BVf3cbZ0yb0nZSPW8YZ4u7iMbNl4GmjD%2FOfLzPnNKxMgAfs%3D&contract=' + global.CONTRACT_ADDRESS + '&provider=http://127.0.0.1:8545'
            control_01 = new Control(new Entity(), (value) => {
                console.log("        progress [%] => " + value)
            }, url);
            control_01.runLoadTable();
            return Utils.sleep(1500).then(() => {
                    assert.equal(control_01.entity.events.length, 4);
                }
            )
        });

        it('2.1.7 check correct number of past events', function () {
            control_01.getPastEvents();
            return Utils.sleep(100).then(() => {
                    assert.equal(control_01.entity.events.length, 4);
                }
            )
        });

    });

});