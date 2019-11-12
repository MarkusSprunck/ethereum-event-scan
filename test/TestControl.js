const {assert} = require('chai');
const Utils = require("../src/utils.js");
const Entity = require("../src/entity.js");
const Control = require("../src/control.js");

let control = {};

describe('Class: Control', function () {

    describe('2.1 constructor()', function () {


        it('2.1.1 check default values of attributes', function () {
            console.log('        contract => ' + global.CONTRACT_ADDRESS);
            const url = 'http://localhost:55226/main.html?abi=eJylkjFPxDAMhf%2BL504Ibuh6rGxspw6%2B1FdFap0qse%2BoTv3vJNBrQkGAYEz8%2FN5ny4crWB5VAtSHpoIRJzz2BPUJ%2B0AVBEGhJxU82t7KBDWw45uoApnGqAXjOIhXI87DXF0Bo2ganIbVZ81IcS29UFuUhDxj%2F%2FzuhW3rKYRozjikD3dh8jnrVk85P1hFJstddhpiH3YF9yKYm1Wyz5M8Oi6kdCaWfw%2Bn8b27z0TGaXRdQ5byBx5NDl9xvC0d46OOwCVF7u5I9kuCUykgP0HdPey%2BpUr1%2BVf3cbZ0yb0nZSPW8YZ4u7iMbNl4GmjD%2FOfLzPnNKxMgAfs%3D&contract=' + global.CONTRACT_ADDRESS + '&provider=http://127.0.0.1:8545'
            control = new Control(new Entity(), (value) => {
                console.log("        progress [%] => " + value)
            }, url);

            assert.equal(control.trxNumber, '');
            assert.equal(control.blockNumber, '');
            assert.equal(control.contractAddress, global.CONTRACT_ADDRESS);
            assert.equal(control.serverHost, 'localhost:55226');
            assert.equal(control.eventsBlockTo, 'latest');
            assert.equal(control.eventsBlockFrom, '');
            assert.equal(control.eventsBlockFromInitial, '');
            assert.equal(control.getEventsSucceeded, false);
            assert.equal(control.getEventsProgress, 100);
        });

        it('2.1.2 check correct number of past events', function () {
            control.getPastEvents();

            return Utils.sleep(600).then(() => {
                    assert.equal(control.entity.events.length, 4);
                }
            )
        });

        it('2.1.3 check default values of attributes with invalid abi', function () {
            const url1 = 'http://localhost:55226/main.html?abi=eJyLrowFAAJjATI%3D&contract=' + global.CONTRACT_ADDRESS;
            const control1 = new Control(new Entity(), (value) => {}, url1);
            return Utils.sleep(20).then(() => {
                console.log('        lastMessage => ' + control1.lastMessage);
                assert.equal("Unable to parse ABI", control1.lastMessage);
            });
        });






    });

});