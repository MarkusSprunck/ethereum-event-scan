const { assert } = require('chai');
const Utils = require("../src/utils.js");


describe('Class: Utils', function () {

    describe('convertTimestamp()', function () {

        it('get expected "03.11.2019 21:45:41h" for 1572813941', function () {
            assert.equal(Utils.convertTimestamp(1572813941), "03.11.2019 21:45:41h");
        });

        it('get expected "01.01.1970 01:00:00h" for 0', function () {
            assert.equal(Utils.convertTimestamp(0), "01.01.1970 01:00:00h");
        });

        it('get expected "01.01.1970 01:00:00h" for null', function () {
            assert.equal(Utils.convertTimestamp(null), "01.01.1970 01:00:00h");
        });
    });

    describe('truncate()', function () {

        it('get no truncate for (sting.length + 1)', function () {
            assert.equal(Utils.truncate('abcdefghijklmnopxyz', 19), "abcdefghijklmnopxyz");
        });

        it('get truncated sting for (string.length)', function () {
            assert.equal(Utils.truncate('abcdefghijklmnopxyz', 18), "abcdefghi…mnopxyz");
        });

        it('get truncated sting for 5', function () {
            assert.equal(Utils.truncate('abcdefghijklmnopxyz', 5), "abc…");
        });

        it('get truncated sting for 1', function () {
            assert.equal(Utils.truncate('abcdefghijklmnopxyz', 1), "a…");
        });

        it('get truncated sting for 0', function () {
            assert.equal(Utils.truncate('abcdefghijklmnopxyz', 0), "…");
        });
    });


    describe('spaces()', function () {

        it('nothing for empty sting', function () {
            assert.equal(Utils.spaces(''), '');
        });

        it('one non braking space for sting with one space', function () {
            assert.equal(Utils.spaces(' '), '&nbsp;');
        });

        it('two non braking spaces for sting with two spaces', function () {
            assert.equal(Utils.spaces('  '), '&nbsp;&nbsp;');
        });
    });


    describe('sleep()', function () {
        it('wait 10ms and check expected longer or equal', function () {
            let start = new Date;
            console.log("        start  => " + start.getMilliseconds() + "ms");
            return Utils.sleep(10).then(() => {
                let finish = new Date;
                console.log("        finish => " + finish.getMilliseconds() + "ms");
                assert((finish - start) > 9);
            })
        });

        it('wait 10ms and check expected shorter', function () {
            let start = new Date;
            console.log("        start  => " + start.getMilliseconds() + "ms");
            return Utils.sleep(10).then(() => {
                let finish = new Date;
                console.log("        finish => " + finish.getMilliseconds() + "ms");
                assert(finish - start <= 15);
            })
        });

        it('wait 20ms and check expected longer or equal', function () {
            let start = new Date;
            console.log("        start  => " + start.getMilliseconds() + "ms");
            return Utils.sleep(20).then(() => {
                let finish = new Date;
                console.log("        finish => " + finish.getMilliseconds() + "ms");
                assert((finish - start) > 19);
            })
        });

        it('wait 20ms and check expected shorter', function () {
            let start = new Date;
            console.log("        start  => " + start.getMilliseconds() + "ms");
            return Utils.sleep(20).then(() => {
                let finish = new Date;
                console.log("        finish => " + finish.getMilliseconds() + "ms");
                assert(finish - start <= 30);
            })
        });
    });
});
