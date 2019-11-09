const {assert} = require('chai');
const Utils = require("../src/utils.js");


describe('Class: Utils', function () {

    describe('4.1 convertTimestamp()', function () {

        it('4.1.1 get expected "03.11.2019 21:45:41h" for 1572813941', function () {
            assert.equal(Utils.convertTimestamp(1572813941), "03.11.2019 21:45:41h");
        });

        it('4.1.2 get expected "01.01.1970 01:00:00h" for 0', function () {
            assert.equal(Utils.convertTimestamp(0), "01.01.1970 01:00:00h");
        });

        it('4.1.3 get expected "01.01.1970 01:00:00h" for null', function () {
            assert.equal(Utils.convertTimestamp(null), "01.01.1970 01:00:00h");
        });
    });

    describe('4.2 truncate()', function () {

        it('4.2.1 get no truncate for (sting.length + 1)', function () {
            assert.equal(Utils.truncate('abcdefghijklmnopxyz', 19), "abcdefghijklmnopxyz");
        });

        it('4.2.2 get truncated sting for (string.length)', function () {
            assert.equal(Utils.truncate('abcdefghijklmnopxyz', 18), "abcdefghi…mnopxyz");
        });

        it('4.2.3 get truncated sting for 5', function () {
            assert.equal(Utils.truncate('abcdefghijklmnopxyz', 5), "abc…");
        });

        it('4.2.4 get truncated sting for 1', function () {
            assert.equal(Utils.truncate('abcdefghijklmnopxyz', 1), "a…");
        });

        it('4.2.5 get truncated sting for 0', function () {
            assert.equal(Utils.truncate('abcdefghijklmnopxyz', 0), "…");
        });
    });


    describe('4.3 spaces()', function () {

        it('4.3.1 nothing for empty sting', function () {
            assert.equal(Utils.spaces(''), '');
        });

        it('4.3.2 one non braking space for sting with one space', function () {
            assert.equal(Utils.spaces(' '), '&nbsp;');
        });

        it('4.3.3 two non braking spaces for sting with two spaces', function () {
            assert.equal(Utils.spaces('  '), '&nbsp;&nbsp;');
        });
    });


    describe('4.4 sleep()', function () {

        it('4.4.1 wait 10ms and check expected longer or equal', function () {
            let start = new Date;
            console.log("        start  => " + start.getMilliseconds() + "ms");
            return Utils.sleep(10).then(() => {
                let finish = new Date;
                console.log("        finish => " + finish.getMilliseconds() + "ms");
                assert((finish - start) > 9);
            })
        });

        it('4.4.2 wait 10ms and check expected shorter', function () {
            let start = new Date;
            console.log("        start  => " + start.getMilliseconds() + "ms");
            return Utils.sleep(10).then(() => {
                let finish = new Date;
                console.log("        finish => " + finish.getMilliseconds() + "ms");
                assert(finish - start <= 15);
            })
        });

        it('4.4.3 wait 20ms and check expected longer or equal', function () {
            let start = new Date;
            console.log("        start  => " + start.getMilliseconds() + "ms");
            return Utils.sleep(20).then(() => {
                let finish = new Date;
                console.log("        finish => " + finish.getMilliseconds() + "ms");
                assert((finish - start) > 19);
            })
        });

        it('4.4.4 wait 20ms and check expected shorter', function () {
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
