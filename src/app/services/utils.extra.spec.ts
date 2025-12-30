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
      expect(out.startsWith(s.substring(0,5))).toBeTruthy();
      expect(out.endsWith(s.substring(5))).toBeTruthy();
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
