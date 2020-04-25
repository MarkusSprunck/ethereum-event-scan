import {UtilsService} from './utils.service';

describe('Class: UtilsService', () => {

    describe('convertTimestamp()', () => {

        it('get expected 03.11.2019 21:45:41h for 1572813941', () => {
            expect(UtilsService.convertTimestamp(1572813941)).toEqual('03.11.2019 21:45:41h');
        });

        it('get expected 01.01.1970 01:00:00h for 0', () => {
            expect(UtilsService.convertTimestamp(0)).toEqual('01.01.1970 01:00:00h');
        });

        it('get expected 01.01.1970 01:00:00h for null', () => {
            expect(UtilsService.convertTimestamp(null)).toEqual('01.01.1970 01:00:00h');
        });
    });

    describe('truncate()', () => {

        it('get no truncate for (sting.length + 1)', () => {
            expect(UtilsService.truncate('abcdefghijklmnopxyz', 19)).toEqual('abcdefghijklmnopxyz');
        });

        it('get truncated sting for (string.length)', () => {
            expect(UtilsService.truncate('abcdefghijklmnopxyz', 18)).toEqual('abcdefghi…mnopxyz');
        });

        it('get truncated sting for 5', () => {
            expect(UtilsService.truncate('abcdefghijklmnopxyz', 5)).toEqual('abc…');
        });

        it('get truncated sting for 1', () => {
            expect(UtilsService.truncate('abcdefghijklmnopxyz', 1)).toEqual('a…');
        });

        it('get truncated sting for 0', () => {
            expect(UtilsService.truncate('abcdefghijklmnopxyz', 0)).toEqual('…');
        });
    });


    describe('spaces()', () => {

        it('nothing for empty sting', () => {
            expect(UtilsService.spaces('')).toEqual('');
        });

        it('one non braking space for sting with one space', () => {
            expect(UtilsService.spaces(' ')).toEqual('&nbsp;');
        });

        it('two non braking spaces for sting with two spaces', () => {
            expect(UtilsService.spaces('  ')).toEqual('&nbsp;&nbsp;');
        });
    });


});
