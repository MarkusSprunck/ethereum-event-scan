import { UtilsService } from './utils.service';

describe('UtilsService - additional tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('break()', () => {
    it('returns original string when not exceeding threshold', () => {
      expect(UtilsService.break('12345', 3)).toEqual('12345');
    });

    it('inserts newline when string is longer than twice maxLength', () => {
      const s = 'abcdefghijklmnopqrstuvwxyz';
      const out = UtilsService.break(s, 5);
      expect(out).toContain('\n');
      expect(out.startsWith(s.substr(0,5))).toBeTruthy();
      expect(out.endsWith(s.substring(5))).toBeTruthy();
    });
  });

  describe('updateURLParameter()', () => {
    it('calls history.pushState with updated search params', () => {
      const pushSpy = jest.spyOn(window.history, 'pushState');

      // Don't attempt to redefine window.location (not configurable in jsdom).
      // Just spy on history.pushState and call the helper which creates a new URL
      // from window.location.href internally.
      UtilsService.updateURLParameter('foo', 'bar');
      expect(pushSpy).toHaveBeenCalled();
      const lastCallArg = pushSpy.mock.calls[pushSpy.mock.calls.length - 1][2];
      expect(lastCallArg).toMatch(/foo=bar/);
    });
  });

  describe('updateURLWithCompressedAbi()', () => {
    it('gzip-compresses, base64-encodes and calls updateURLParameter with url-safe value', () => {
      // mock pako.gzip to return Uint8Array
      const fakeArr = new Uint8Array([1,2,3,4,5]);
      jest.spyOn(require('pako'), 'gzip').mockReturnValue(fakeArr as any);

      // mock btoa to return a string with + and / and padding
      const origBtoa = (global as any).btoa;
      (global as any).btoa = jest.fn().mockReturnValue('AB+C/=');

      const spy = jest.spyOn(UtilsService as any, 'updateURLParameter');
      UtilsService.updateURLWithCompressedAbi('test-abi-content');

      expect(spy).toHaveBeenCalled();
      const calledWithValue = spy.mock.calls[0][1];
      // '+' should be replaced with '-', '/' with '_' and padding removed
      expect(calledWithValue).toContain('AB-C_');

      // restore btoa
      (global as any).btoa = origBtoa;
    });
  });

  describe('fetchABIFromVerifiedContract()', () => {
    it('invokes callback when XHR returns JSON array', () => {
      const origXHR = (global as any).XMLHttpRequest;
      const origSetTimeout = (global as any).setTimeout;

      // Fake XHR that calls onreadystatechange with readyState=4 and status=200
      class FakeXHR {
        public readyState = 0;
        public status = 0;
        public responseText = '';
        public onreadystatechange: any = null;
        open(_method: any, _url: any, _async: any) { /* noop */ }
        send() {
          this.readyState = 4;
          this.status = 200;
          this.responseText = '[{"ok":true}]';
          if (this.onreadystatechange) { this.onreadystatechange(); }
        }
      }

      (global as any).XMLHttpRequest = FakeXHR as any;
      // Make setTimeout run synchronously so the forEach timers execute immediately
      (global as any).setTimeout = (fn: any) => { fn(); return 0; };

      const cb = jest.fn();
      UtilsService.fetchABIFromVerifiedContract('0xabc', cb);

      expect(cb).toHaveBeenCalled();

      // restore
      (global as any).XMLHttpRequest = origXHR;
      (global as any).setTimeout = origSetTimeout;
    });
  });
});
