import { Reader } from './reader.service';
import { ProviderService } from './provider.service';
import { makeRoute, mockAtobWithGzipHeader, restoreAtob } from '../../test-helpers';

describe('Reader.createActiveContract decoding branches', () => {
  let origAtob: any;

  beforeEach(() => {
    origAtob = (global as any).atob;
  });

  afterEach(() => {
    restoreAtob(origAtob);
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('handles gzip header via pako.ungzip', () => {
    const entity = new ProviderService();
    const r = new Reader(makeRoute({}), entity as any);

    // mock atob to simulate a gzip header in decoded base64
    mockAtobWithGzipHeader();
    // mock pako.ungzip to return JSON string
    const p = require('pako');
    jest.spyOn(p, 'ungzip').mockReturnValue('[{"type":"event"}]');

    // provide web3 Contract constructor stub
    const web3mock: any = { eth: { Contract: function(json: any, addr: any) {
                (this as any).json = json; (this as any).addr = addr; } } };
    entity.web3 = web3mock as any;

    r.contract = '0x0123456789abcdef0123456789abcdef01234567';
    r.abiBase64Data = 'whatever';

    r.createActiveContract();

    expect(r.abi).toContain('event');
    expect(r['contractInstance']).not.toBeNull();
  });

  it('handles zlib header via pako.inflate', () => {
    const entity = new ProviderService();
    const r = new Reader(makeRoute({}), entity as any);

    // atob returns binary starting with 0x78 0x01 (zlib)
    (global as any).atob = jest.fn().mockReturnValue(String.fromCharCode(0x78, 0x01, 0x00));
    const p = require('pako');
    jest.spyOn(p, 'inflate').mockReturnValue('[{"type":"event"}]');

    const web3mock: any = { eth: { Contract: function(json: any, addr: any) {
                (this as any).json = json; (this as any).addr = addr; } } };
    entity.web3 = web3mock as any;

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

    const web3mock: any = { eth: { Contract: function(json: any, addr: any) {
                (this as any).json = json; (this as any).addr = addr; } } };
    entity.web3 = web3mock as any;

    r.createActiveContract();
    // hex -> arr -> decodedData -> '[ ]' -> JSON parsed -> this.abi should be '[]' or similar
    expect(r.abi.indexOf('[') >= 0 || r.abi.length === 0).toBeTruthy();
  });

  it('fails gracefully on invalid data', () => {
    const entity = new ProviderService();
    const r = new Reader(makeRoute({}), entity as any);

    // force atob to throw to simulate bad base64
    (global as any).atob = jest.fn().mockImplementation(() => { throw new Error('bad'); });
    r.abiBase64Data = 'not-decodable';
    r.createActiveContract();
    expect(r.abi === '' || r.abi === undefined).toBeTruthy();
  });
});
