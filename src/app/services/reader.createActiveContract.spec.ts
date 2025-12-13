import { Reader } from './reader.service';
import { ActivatedRoute } from '@angular/router';
import { ProviderService } from './provider.service';

function makeRoute(params: any) {
  return { queryParams: { subscribe: (fn: any) => fn(params) } } as any as ActivatedRoute;
}

describe('Reader.createActiveContract decoding branches', () => {
  let origAtob: any;
  let pako: any;

  beforeEach(() => {
    origAtob = (global as any).atob;
    // ensure fresh pako module to mock
    pako = require('pako');
  });

  afterEach(() => {
    (global as any).atob = origAtob;
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('handles gzip header via pako.ungzip', () => {
    const entity = new ProviderService();
    const r = new Reader(makeRoute({}), entity as any);

    // mock atob to return binary string with gzip header 0x1f 0x8b
    const bin = String.fromCharCode(0x1f, 0x8b, 0x00, 0x00);
    (global as any).atob = jest.fn().mockReturnValue(bin);

    // mock pako.ungzip to return JSON string
    const p = require('pako');
    jest.spyOn(p, 'ungzip').mockReturnValue('[{"type":"event"}]');

    // provide web3 Contract constructor stub
    entity.web3 = { eth: { Contract: function(json: any, addr: any) { // @ts-ignore
                this.json = json; this.addr = addr; } } } as any;

    r.contract = '0x0123456789abcdef0123456789abcdef01234567';
    r.abiBase64Data = 'whatever';

    r.createActiveContract();

    expect(r.abi).toContain('event');
    expect(r['contractInstance']).not.toBeNull();
  });

  it('handles zlib header via pako.inflate', () => {
    const entity = new ProviderService();
    const r = new Reader(makeRoute({}), entity as any);

    // atob returns binary starting with 0x78 0x01
    const bin = String.fromCharCode(0x78, 0x01, 0x00);
    (global as any).atob = jest.fn().mockReturnValue(bin);

    const p = require('pako');
    jest.spyOn(p, 'inflate').mockReturnValue('[{"type":"event"}]');

    entity.web3 = { eth: { Contract: function(json: any, addr: any) { // @ts-ignore
                this.json = json; this.addr = addr; } } } as any;

    r.contract = '0x0123456789abcdef0123456789abcdef01234567';
    r.abiBase64Data = 'anything';

    r.createActiveContract();
    expect(r.abi).toContain('event');
    expect(r['contractInstance']).not.toBeNull();
  });

  it('handles hex abi input (0x..)', () => {
    const entity = new ProviderService();
    const r = new Reader(makeRoute({}), entity as any);

    // provide hex string for [] -> 0x5b5d
    r.abiBase64Data = '0x5b5d';
    r.contract = '0x0123456789abcdef0123456789abcdef01234567';

    entity.web3 = { eth: { Contract: function(json: any, addr: any) { // @ts-ignore
                this.json = json; this.addr = addr; } } } as any;

    r.createActiveContract();
    // hex -> arr -> decodedData -> '[ ]' -> JSON parsed -> this.abi should be '[]' or similar
    expect(r.abi.indexOf('[') >= 0 || r.abi.length === 0).toBeTruthy();
  });

  it('fails gracefully on invalid data', () => {
    const entity = new ProviderService();
    const r = new Reader(makeRoute({}), entity as any);

    (global as any).atob = jest.fn().mockImplementation(() => { throw new Error('bad'); });
    r.abiBase64Data = 'not-decodable';
    r.createActiveContract();
    expect(r.abi === '' || r.abi === undefined).toBeTruthy();
  });
});

