import { UtilsService } from './utils.service';

describe('UtilsService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('convertTimestamp handles number, string and bigint', () => {
    // 1 Feb 2009 00:31:30 UTC -> timestamp 1234567890
    expect(UtilsService.convertTimestamp(1234567890)).toBe('14.02.2009 00:31:30h');
    expect(UtilsService.convertTimestamp('1234567890')).toBe('14.02.2009 00:31:30h');
    expect(UtilsService.convertTimestamp(BigInt(1234567890))).toBe('14.02.2009 00:31:30h');
  });

  it('truncate returns original if not exceeding and truncates in middle when needed', () => {
    const short = 'abcdef';
    expect(UtilsService.truncate(short, 10)).toBe(short);

    const long = 'abcdefghijklmnopqrstuvwxyz';
    const truncated = UtilsService.truncate(long, 10);
    expect(truncated).toContain('…');
    // left portion should be present
    expect(long.startsWith(truncated.split('…')[0])).toBe(true);
    // right portion should be present
    expect(long.endsWith(truncated.split('…')[1])).toBe(true);
  });

  it('break inserts newline only when string is sufficiently long', () => {
    const s = 'abcdefghij';
    expect(UtilsService.break(s, 6)).toBe(s); // length < maxLength*2 -> unchanged

    const long = 'abcdefghijklmno';
    const broken = UtilsService.break(long, 5);
    expect(broken).toContain('\n');
    const parts = broken.split('\n');
    expect(parts[0].length).toBe(5);
  });

  it('compressAbiToUrlSafe returns URL-safe base64-like string', () => {
    const abi = '[{"type":"event"}]';
    const out = UtilsService.compressAbiToUrlSafe(abi);
    // should only contain URL-safe base64 chars
    expect(/^[A-Za-z0-9_-]+$/.test(out)).toBe(true);
    expect(out.length).toBeGreaterThan(0);
  });

  describe('updateURLParameter ordering and pushState', () => {
    let originalHref: string;
    beforeEach(() => {
      originalHref = window.location.href;
      // set an initial URL with params in the order: provider, contract, start, foo, abi
      window.history.pushState({}, '', '/?provider=x&contract=0x1&start=1&foo=bar&abi=OLD#hash');
      jest.spyOn(window.history, 'pushState');
    });
    afterEach(() => {
      // restore to original
      window.history.pushState({}, '', originalHref);
      (window.history.pushState as jest.MockedFunction<any>).mockRestore?.();
    });

    it('moves abi to the end and orders primary params first when appendToEnd true', () => {
      UtilsService.updateURLParameter('abi', 'NEW', true);
      expect(window.history.pushState).toHaveBeenCalled();
      const calledWith = (window.history.pushState as jest.Mock).mock.calls[0][2] as string;
      expect(calledWith.startsWith('/?')).toBe(true);
      // expect start first, then provider, contract, then foo, then abi
      expect(calledWith).toContain('start=1');
      expect(calledWith.indexOf('start=1') < calledWith.indexOf('provider=x')).toBe(true);
      expect(calledWith.indexOf('provider=x') < calledWith.indexOf('contract=0x1')).toBe(true);
      expect(calledWith.endsWith('abi=NEW') || calledWith.includes('&abi=NEW#hash') ).toBe(true);
    });

    it('updateURLWithCompressedAbi delegates to compress and updateURLParameter', () => {
      const spyCompress = jest.spyOn(UtilsService, 'compressAbiToUrlSafe').mockReturnValue('CMP');
      const spyUpdate = jest.spyOn(UtilsService, 'updateURLParameter').mockImplementation(() => {});
      UtilsService.updateURLWithCompressedAbi('{"a":1}');
      expect(spyCompress).toHaveBeenCalled();
      expect(spyUpdate).toHaveBeenCalledWith('abi', 'CMP', true);
      spyCompress.mockRestore();
      spyUpdate.mockRestore();
    });
  });

  it('reloadAfterUpdate triggers injected reloadFn after timeout', () => {
    const reloadMock = jest.fn();
    // mock setTimeout to execute immediately
    const setTimeoutSpy = jest.spyOn(global as any, 'setTimeout').mockImplementation((cb: any, _ms?: any) => { cb(); return 1 as any; });

    UtilsService.reloadAfterUpdate(100, reloadMock);

    expect(reloadMock).toHaveBeenCalled();

    setTimeoutSpy.mockRestore();
  });

  it('spaces replaces whitespace with &nbsp;', () => {
    expect(UtilsService.spaces('a b\tc')).toBe('a&nbsp;b&nbsp;c');
  });

  it('fetchABIFromVerifiedContract invokes callback when response starts with [{', () => {
    jest.useFakeTimers();
    const originalXMLHttpRequest = (global as any).XMLHttpRequest;

    class FakeXhr {
      readyState = 0;
      status = 0;
      responseText = '';
      onreadystatechange: any = null;
      open(_m: any, _u: any, _a: any) {}
      send() {
        // simulate async response
        setTimeout(() => {
          this.readyState = 4;
          this.status = 200;
          this.responseText = '[{"ok":true}]';
          if (this.onreadystatechange) { this.onreadystatechange(); }
        }, 0);
      }
    }

    (global as any).XMLHttpRequest = FakeXhr;

    const cb = jest.fn();
    UtilsService.fetchABIFromVerifiedContract('0x1', cb);

    // advance timers enough to run the scheduled domain timeout and nested callbacks
    // there are multiple setTimeouts (counter * 1000 + 50) for several domains; advance by a few seconds
    jest.advanceTimersByTime(5000);
    jest.runOnlyPendingTimers();
    jest.runAllTimers();

    expect(cb).toHaveBeenCalledWith('[{"ok":true}]');

    // restore
    (global as any).XMLHttpRequest = originalXMLHttpRequest;
    jest.useRealTimers();
  });

  it('fetchABIFromVerifiedContract calls open/send for the constructed URL (covers open/send lines)', () => {
    jest.useFakeTimers();
    const originalXMLHttpRequest = (global as any).XMLHttpRequest;

    const opens: any[] = [];
    let sends = 0;

    class FakeXhr2 {
      readyState = 0;
      status = 0;
      responseText = '';
      onreadystatechange: any = null;
      open(method: string, url: string, asyncFlag?: boolean) {
        opens.push({ method, url, asyncFlag });
      }
      send() {
        sends++;
        // do not call onreadystatechange to avoid invoking callback
      }
    }

    (global as any).XMLHttpRequest = FakeXhr2;

    const cb = jest.fn();
    const contractAddress = '0xDEADBEEF';
    UtilsService.fetchABIFromVerifiedContract(contractAddress, cb);

    // advance timers for first scheduled call (counter=0 -> 50ms)
    jest.advanceTimersByTime(200);
    jest.runOnlyPendingTimers();
    jest.runAllTimers();

    // restore
    (global as any).XMLHttpRequest = originalXMLHttpRequest;
    jest.useRealTimers();

    // assertions: open should have been called at least once and send should be invoked
    expect(opens.length).toBeGreaterThan(0);
    const firstOpen = opens[0];
    expect(firstOpen.method).toBe('GET');
    expect(firstOpen.url).toContain('/api?module=contract&action=getabi&format=raw&address=' + contractAddress);
    expect(sends).toBeGreaterThan(0);
    // callback shouldn't be called because FakeXhr2 does not invoke onreadystatechange
    expect(cb).not.toHaveBeenCalled();
  });

});
