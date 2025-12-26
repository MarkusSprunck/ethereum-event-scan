import {UtilsService} from './utils.service';
import { TestBed } from '@angular/core/testing';

describe('Class: UtilsService', () => {

  describe('convertTimestamp()', () => {

    it('get expected 03.11.2019 21:45:41h for 1572813941', () => {
      expect(UtilsService.convertTimestamp(1572813941)).toEqual('03.11.2019 21:45:41h');
    });

    it('get expected 01.01.1970 01:00:00h for 0', () => {
      expect(UtilsService.convertTimestamp(0)).toEqual('01.01.1970 01:00:00h');
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

  it('should call updateURLParameter when compressing ABI', () => {
    const spy = jest.spyOn(UtilsService as any, 'updateURLParameter');
    UtilsService.updateURLWithCompressedAbi('{"a":1}');
    expect(spy).toHaveBeenCalledWith('abi', expect.any(String), true);
    spy.mockRestore();
  });

  it('compressAbiToUrlSafe produces URL-safe characters only', () => {
    const json = JSON.stringify([{name: 'x'}]);
    const res = UtilsService.compressAbiToUrlSafe(json);
    // ensure no plus, slash or padding equals present
    expect(res).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it('updateURLParameter appends abi as last parameter and uses pushState', () => {
    // preserve original href
    const originalHref = window.location.href;
    try {
      // set a controlled location
      (window as any).location.href = 'http://localhost/test?b=2&start=1&c=3';
      const pushSpy = jest.spyOn(window.history, 'pushState').mockImplementation(() => {});
      UtilsService.updateURLParameter('abi', 'SOMEVALUE', true);
      expect(pushSpy).toHaveBeenCalled();
      const newUrl = (pushSpy.mock.calls[0] as any)[2];
      expect(newUrl).toMatch(/abi=SOMEVALUE$/);
      pushSpy.mockRestore();
    } finally {
      try { (window as any).location.href = originalHref; } catch(e) { /* ignore */ }
    }
  });

  it('reloadAfterUpdate schedules a reload', () => {
    jest.useFakeTimers();
    // call and advance timers to ensure no thrown errors when reload is invoked
    expect(() => {
      UtilsService.reloadAfterUpdate(10);
      jest.advanceTimersByTime(20);
    }).not.toThrow();
    jest.useRealTimers();
  });

  describe('UtilsService', () => {
    let service: UtilsService;

    beforeEach(() => {
      TestBed.configureTestingModule({});
      service = TestBed.inject(UtilsService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should truncate a string correctly', () => {
      const result = UtilsService.truncate('abcdefghijklmnopxyz', 10);
      expect(result).toEqual('abcde…xyz');
    });
  });
});
