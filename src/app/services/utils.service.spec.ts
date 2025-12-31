// Consolidated tests for UtilsService (merged from previous utils.*.spec.ts files)
import {UtilsService} from './utils.service';
import {TestBed} from '@angular/core/testing';

describe('UtilsService - consolidated', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    describe('convertTimestamp()', () => {
        it('get expected 03.11.2019 21:45:41h for 1572813941', () => {
            expect(UtilsService.convertTimestamp(1572813941)).toEqual('03.11.2019 21:45:41h');
        });

        it('get expected 01.01.1970 01:00:00h for 0', () => {
            expect(UtilsService.convertTimestamp(0)).toEqual('01.01.1970 01:00:00h');
        });

        it('convertTimestamp handles number, string and bigint', () => {
            // 1 Feb 2009 00:31:30 UTC -> timestamp 1234567890
            expect(UtilsService.convertTimestamp(1234567890)).toBe('14.02.2009 00:31:30h');
            expect(UtilsService.convertTimestamp('1234567890')).toBe('14.02.2009 00:31:30h');
            expect(UtilsService.convertTimestamp(BigInt(1234567890))).toBe('14.02.2009 00:31:30h');
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

        it('should truncate a string correctly (service style)', () => {
            const result = UtilsService.truncate('abcdefghijklmnopxyz', 10);
            expect(result).toEqual('abcde…xyz');
        });
    });

    describe('break() / spaces()', () => {
        it('returns original string when not exceeding threshold', () => {
            expect(UtilsService.break('12345', 3)).toEqual('12345');
        });

        it('inserts newline when string is longer than twice maxLength', () => {
            const s = 'abcdefghijklmnopqrstuvwxyz';
            const out = UtilsService.break(s, 5);
            expect(out).toContain('\n');
            expect(out.startsWith(s.substring(0, 5))).toBeTruthy();
            expect(out.endsWith(s.substring(5))).toBeTruthy();
        });

        it('break inserts newline only when string is sufficiently long (other case)', () => {
            const long = 'abcdefghijklmno';
            const broken = UtilsService.break(long, 5);
            expect(broken).toContain('\n');
            const parts = broken.split('\n');
            expect(parts[0].length).toBe(5);
        });

        it('spaces replaces whitespace with &nbsp;', () => {
            expect(UtilsService.spaces('a b\tc')).toBe('a&nbsp;b&nbsp;c');
            expect(UtilsService.spaces('')).toEqual('');
            expect(UtilsService.spaces(' ')).toEqual('&nbsp;');
            expect(UtilsService.spaces('  ')).toEqual('&nbsp;&nbsp;');
        });
    });

    describe('compress / URL helpers', () => {
        it('compressAbiToUrlSafe returns URL-safe base64-like string', () => {
            const abi = '[{"type":"event"}]';
            const out = UtilsService.compressAbiToUrlSafe(abi);
            expect(/^[A-Za-z0-9_-]+$/.test(out)).toBe(true);
            expect(out.length).toBeGreaterThan(0);
        });

        it('compressAbiToUrlSafe produces URL-safe characters only (alternate)', () => {
            const json = JSON.stringify([{name: 'x'}]);
            const res = UtilsService.compressAbiToUrlSafe(json);
            expect(res).toMatch(/^[A-Za-z0-9\-_]+$/);
        });

        it('updateURLParameter ordering and pushState behavior', () => {
            const originalHref: string = window.location.href;
            try {
                window.history.pushState({}, '', '/?provider=x&contract=0x1&start=1&foo=bar&abi=OLD#hash');
                jest.spyOn(window.history, 'pushState');
                UtilsService.updateURLParameter('abi', 'NEW', true);
                expect(window.history.pushState).toHaveBeenCalled();
                const calledWith = (window.history.pushState as jest.Mock).mock.calls[0][2] as string;
                expect(calledWith.startsWith('/?')).toBe(true);
                expect(calledWith).toContain('start=1');
                expect(calledWith.indexOf('start=1') < calledWith.indexOf('provider=x')).toBe(true);
                expect(calledWith.indexOf('provider=x') < calledWith.indexOf('contract=0x1')).toBe(true);
                expect(calledWith.endsWith('abi=NEW') || calledWith.includes('&abi=NEW#hash')).toBe(true);
            } finally {
                window.history.pushState({}, '', originalHref);
                (window.history.pushState as jest.MockedFunction<any>).mockRestore?.();
            }
        });

        it('updateURLWithCompressedAbi delegates to compress and updateURLParameter', () => {
            const spyCompress = jest.spyOn(UtilsService, 'compressAbiToUrlSafe').mockReturnValue('CMP');
            const spyUpdate = jest.spyOn(UtilsService, 'updateURLParameter').mockImplementation(() => {
            });
            UtilsService.updateURLWithCompressedAbi('{"a":1}');
            expect(spyCompress).toHaveBeenCalled();
            expect(spyUpdate).toHaveBeenCalledWith('abi', 'CMP', true);
            spyCompress.mockRestore();
            spyUpdate.mockRestore();
        });
    });

    describe('reloadAfterUpdate and fetchABIFromVerifiedContract', () => {
        it('reloadAfterUpdate schedules a reload (fast path)', () => {
            const reloadMock = jest.fn();
            const setTimeoutSpy = jest.spyOn(global as any, 'setTimeout').mockImplementation((cb: any, _ms?: any) => {
                cb();
                return 1 as any;
            });
            UtilsService.reloadAfterUpdate(100, reloadMock);
            expect(reloadMock).toHaveBeenCalled();
            setTimeoutSpy.mockRestore();
        });

        it('reloadAfterUpdate schedules a reload (jest timers)', () => {
            jest.useFakeTimers();
            expect(() => {
                UtilsService.reloadAfterUpdate(10);
                jest.advanceTimersByTime(20);
            }).not.toThrow();
            jest.useRealTimers();
        });

        it('fetchABIFromVerifiedContract invokes callback when XHR returns JSON array (fake timers)', () => {
            jest.useFakeTimers();
            const originalXMLHttpRequest = (global as any).XMLHttpRequest;

            class FakeXhr {
                readyState = 0;
                status = 0;
                responseText = '';
                onreadystatechange: any = null;

                open(_m: any, _u: any, _a: any) {
                }

                send() {
                    setTimeout(() => {
                        this.readyState = 4;
                        this.status = 200;
                        this.responseText = '[{"ok":true}]';
                        if (this.onreadystatechange) {
                            this.onreadystatechange();
                        }
                    }, 0);
                }
            }

            (global as any).XMLHttpRequest = FakeXhr;
            const cb = jest.fn();
            UtilsService.fetchABIFromVerifiedContract('0x1', cb);
            jest.advanceTimersByTime(5000);
            jest.runOnlyPendingTimers();
            jest.runAllTimers();
            expect(cb).toHaveBeenCalledWith('[{"ok":true}]');
            (global as any).XMLHttpRequest = originalXMLHttpRequest;
            jest.useRealTimers();
        });

        it('fetchABIFromVerifiedContract calls open/send for the constructed URL', () => {
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
                    opens.push({method, url, asyncFlag});
                }

                send() {
                    sends++;
                }
            }

            (global as any).XMLHttpRequest = FakeXhr2 as any;
            const cb = jest.fn();
            const contractAddress = '0xDEADBEEF';
            UtilsService.fetchABIFromVerifiedContract(contractAddress, cb);
            jest.advanceTimersByTime(200);
            jest.runOnlyPendingTimers();
            jest.runAllTimers();
            (global as any).XMLHttpRequest = originalXMLHttpRequest;
            jest.useRealTimers();
            expect(opens.length).toBeGreaterThan(0);
            const firstOpen = opens[0];
            expect(firstOpen.method).toBe('GET');
            expect(firstOpen.url).toContain('/api?module=contract&action=getabi&format=raw&address=' + contractAddress);
            expect(sends).toBeGreaterThan(0);
            expect(cb).not.toHaveBeenCalled();
        });
    });

    describe('TestBed-injected UtilsService', () => {
        let service: UtilsService;

        beforeEach(() => {
            TestBed.configureTestingModule({});
            service = TestBed.inject(UtilsService);
        });

        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });
});
