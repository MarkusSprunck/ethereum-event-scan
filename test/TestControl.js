const {assert} = require('chai');
const Utils = require("../src/utils.js");
const Entity = require("../src/entity.js");
const Control = require("../src/control.js");

var control = {};

describe('Class: Control', function () {

    describe('2.1 constructor()', function () {

        it('2.1.1 check default values of attributes', function () {
            const url = 'http://localhost:55226/main.html?abi=eJylkr1uwzAMhN%2BFs6eiyeA1XbtlCzwwMlMIsElDIpMagd%2B9cn4sxymKoh2pO919oLQ7g%2BfONEK5qwrosMd9Q1AesIlUQFRUejfFvW%2B89lACC99NBWjfJS844ajBnEqAoTgDJlPfisUpZ%2BoY62r6pHomKQXGZnvNwroOFGMKZ2zHAzkxhdx114dqcmxy%2FZvwjIuOxPpvIkvz%2BjUDObGUOpXc5AceGxO%2B47hsCtNQJuA5Rb79Qbq5NYjpDPIJ6mW1%2FpFq1IdfPerR0ynfPRg79cIL4uXiMrJnF6ilBfOfv1Pur74ABo%2FoHw%3D%3D'+ '&contract=' + global.CONTRACT_ADDRESS + '&provider=http://127.0.0.1:8545';
            control = new Control(new Entity(), (value) => { console.log("        value => " + value)}, url);

            assert.equal(control.trxNumber, '');
            assert.equal(control.blockNumber, '');
            assert.equal(control.contractAddress, global.CONTRACT_ADDRESS);
            assert.equal(control.serverHost, 'localhost:55226');
            assert.equal(control.eventsBlockTo, 'latest');
            assert.equal(control.eventsBlockFrom, '');
            assert.equal(control.eventsBlockFromInitial, '');
            assert.equal(control.getEventsSucceeded, false);
            assert.equal(control.getEventsProgress, 100);
            assert.equal(control.firstAlert, true);
        });

        it('2.1.2 check get four past events', function () {
            control.getPastEvents();
            return Utils.sleep(200).then(() => {
                    assert.equal(control.entity.events.length, 4);
                }
            )
        });
    });

});