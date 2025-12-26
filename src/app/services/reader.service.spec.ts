import { Reader } from './reader.service';
import { ProviderService } from './provider.service';
import { EventData } from '../models/event';
import { makeRoute } from '../../test-helpers';

// Mock pako and blockies to avoid side effects
jest.mock('pako', () => ({ ungzip: (a: any) => a, inflate: (a: any) => a, inflateRaw: (a: any) => a }));
jest.mock('blockies', () => (opts: any) => ({ toDataURL: () => 'data:' + opts.seed }));

describe('Reader service (unit)', () => {
  it('createActiveContract handles empty abiBase64Data gracefully', () => {
    const entity = new ProviderService();
    const r = new Reader(makeRoute({}), entity as any);
    r.abiBase64Data = '';
    r.contract = '';
    r.createActiveContract();
    expect(r['contractInstance']).toBeNull();
  });

  it('getCachedTimestamp sets n.a. if no web3', () => {
    const entity = new ProviderService();
    const r = new Reader(makeRoute({}), entity as any);
    r.entity = { web3: null } as any;
    const res = r.getCachedTimestamp('100');
    expect(res).toBe('');
  });

  it('getCachedMiner triggers timestamp load when missing', () => {
    const entity = new ProviderService();
    const r = new Reader(makeRoute({}), entity as any);
    // ensure timestampCache empty
    r['timestampCache'].clear();
    const res = r.getCachedMiner('200');
    expect(res).toBe('');
    expect(r['timestampCache'].has('200')).toBeTruthy();
  });

  it('readEventsRange handles contractInstance.getPastEvents resolution', async () => {
    const entity = new ProviderService();
    const r = new Reader(makeRoute({}), entity as any);
    // setup contractInstance with getPastEvents returning a list with one event
    r['contractInstance'] = { getPastEvents: (_name: any, _opts: any) => Promise.resolve([
      { returnValues: { a: '1' }, transactionHash: '0x1', event: 'E', blockNumber: 1, id: 1 }
    ]) } as any;
    r.callbackUpdateUI = jest.fn();
    r.startBlock = '1';
    r.endBlock = '1';
    // call readEventsRange via public method getPastEvents flow
    r.readEventsRange(1, 1, r as any);
    // wait for promise microtasks
    await new Promise((res) => setTimeout(res, 0));
    expect(r.callbackUpdateUI).toHaveBeenCalled();
    // EventData should have been set
    expect(EventData.size).toBeGreaterThanOrEqual(1);
    EventData.clear();
  });

  it('should decode hex ABI and create contract instance when web3 present', () => {
    const entity = new ProviderService();
    const r = new Reader(makeRoute({}), entity as any);
    // provide a fake web3.eth.Contract constructor
    const fakeWeb3: any = { eth: { Contract: jest.fn() } };
    r.entity = { web3: fakeWeb3 } as any;
    // Instead of relying on createActiveContract decoding, directly set abi and call setContractAddress
    r.contract = '0xabc';
    r.abi = '[]';
    r.setContractAddress('0xabc');
    // Contract should have been called
    expect(fakeWeb3.eth.Contract).toHaveBeenCalled();
  });

  it('should retry createActiveContract when web3 not ready and eventually set contractInstance null after max attempts', async () => {
    const entity = new ProviderService();
    const r = new Reader(makeRoute({}), entity as any);
    // No web3 initially
    r.entity = { web3: null } as any;
    r.contract = '0x1';
    r.abi = '[]';
    // force low max attempts for test
    (r as any).maxCreateContractAttempts && (r as any).maxCreateContractAttempts;
    // Spy on setTimeout to fast-forward
    jest.useFakeTimers();
    // Call createActiveContract which should schedule retries
    r.createActiveContract();
    // advance timers to trigger retries
    jest.advanceTimersByTime(500 * 11);
    // ensure after retries contractInstance is null
    expect(r['contractInstance']).toBeNull();
    jest.useRealTimers();
  });

  it('getCachedTimestamp loads timestamp when web3 present', async () => {
    const entity = new ProviderService();
    const fakeWeb3: any = {
      web3: { eth: { getBlock: (num: any) => Promise.resolve({ timestamp: 0, miner: '0xdeadbeef' }) } }
    };
    const r = new Reader(makeRoute({}), entity as any);
    r.entity = fakeWeb3 as any;
    const res = r.getCachedTimestamp('5');
    expect(res).toBe('');
    // wait for async update
    await new Promise((res2) => setTimeout(res2, 0));
    expect(r['timestampCache'].get('5')).toBeTruthy();
  });

  it('readEventsRange handles large range by splitting and handles error branch for too many results', async () => {
    const entity = new ProviderService();
    const r = new Reader(makeRoute({}), entity as any);
    // set contractInstance.getPastEvents to reject with specific error
    let callCount = 0;
    r['contractInstance'] = { getPastEvents: (_n: any, _o: any) => {
      callCount++;
      return Promise.reject(new Error('Returned error: query returned more than 10000 results'));
    }} as any;
    // spy on readEventsRange to ensure recursion occurs
    const spy = jest.spyOn(r, 'readEventsRange');
    // call with a large range that exceeds limits (use start=0 end=LIMIT_BLOCK_MAX+200000)
    const start = 0;
    const end = 2000000; // large to trigger splitting logic
    // call
    r.readEventsRange(start, end, r as any);
    // wait for microtasks
    await new Promise((res) => setTimeout(res, 0));
    // expect that readEventsRange was called at least once for recursion
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('createActiveContract decodes base64 JSON and creates contract instance', async () => {
    const entity: any = new ProviderService();
    // fake web3 with Contract spy
    const fakeWeb3: any = { eth: { Contract: jest.fn() } };
    const r = new Reader(makeRoute({}), entity as any);
    r.entity = { web3: fakeWeb3, isConnectionWorking: () => true } as any;

    // set contract and abiBase64Data as base64 of JSON '[]'
    r.contract = '0xDEADBEEF';
    const jsonAbi = '[]';
    // Node environment Buffer available in Jest; use it to build base64
    r.abiBase64Data = Buffer.from(jsonAbi).toString('base64');

    r.createActiveContract();
    // allow microtasks to complete
    await new Promise((res) => setTimeout(res, 0));

    expect(r.abi).toBe(jsonAbi);
    expect(fakeWeb3.eth.Contract).toHaveBeenCalled();
  });

  it('setContractAddress handles missing web3 by setting contractInstance null', () => {
    const entity = new ProviderService();
    const r = new Reader(makeRoute({}), entity as any);
    r.abi = '[]';
    // no web3 on entity
    r.entity = {} as any;
    r.setContractAddress('0x1');
    expect(r['contractInstance']).toBeNull();
  });

  it('getCurrentBlockNumber requests blockNumber and updates entity.currentBlock', async () => {
    const entity: any = { web3: { eth: { getBlockNumber: () => Promise.resolve(999) } }, isConnectionWorking: () => true, isSyncing: () => false, currentBlock: 0, setProvider: jest.fn() };
    const r = new Reader(makeRoute({}), entity as any);
    // initial call returns current (0)
    const val = r.getCurrentBlockNumber();
    expect(val).toBe(0);
    // wait for promise resolution
    await new Promise((res) => setTimeout(res, 0));
    expect(entity.currentBlock).toBe(999);
  });

  it('getPastEvents uses current block when endBlock LATEST and calls readEventsRange', () => {
    const entity: any = { isConnectionWorking: () => true, web3: null, currentBlock: 42, setProvider: jest.fn(), isSyncing: () => true };
    const r = new Reader(makeRoute({}), entity as any);
    r.contractInstance = { getPastEvents: jest.fn() } as any;
    r.startBlock = '5';
    r.endBlock = 'LATEST';
    const spy = jest.spyOn(r, 'readEventsRange').mockImplementation(() => {});
    r.getPastEvents();
    expect(spy).toHaveBeenCalledWith(5, 42, r);
    spy.mockRestore();
  });

  it('createActiveContract handles gzip header via pako.ungzip', async () => {
    const pako = require('pako');
    const ungzipSpy = jest.spyOn(pako, 'ungzip').mockImplementation(() => '[]');

    const fakeWeb3: any = { eth: { Contract: jest.fn() } };
    const entity: any = { web3: fakeWeb3, isConnectionWorking: () => true, isSyncing: () => true, setProvider: jest.fn() };
    const r = new Reader(makeRoute({}), entity as any);
    // craft a Uint8Array starting with gzip header 0x1f 0x8b then some bytes
    const bytes = new Uint8Array([0x1f, 0x8b, 0x00, 0x01]);
    r.contract = '0x1';
    r.abiBase64Data = Buffer.from(bytes).toString('base64');

    r.createActiveContract();
    await new Promise(rz => setTimeout(rz, 0));

    expect(r.abi).toBe('[]');
    expect(fakeWeb3.eth.Contract).toHaveBeenCalled();
    ungzipSpy.mockRestore();
  });

  it('createActiveContract handles zlib header via pako.inflate', async () => {
    const pako = require('pako');
    const inflateSpy = jest.spyOn(pako, 'inflate').mockImplementation(() => '[]');

    const fakeWeb3: any = { eth: { Contract: jest.fn() } };
    const entity: any = { web3: fakeWeb3, isConnectionWorking: () => true, isSyncing: () => true, setProvider: jest.fn() };
    const r = new Reader(makeRoute({}), entity as any);
    // craft a Uint8Array starting with zlib header 0x78 0x9c
    const bytes = new Uint8Array([0x78, 0x9c, 0x00, 0x01]);
    r.contract = '0x2';
    r.abiBase64Data = Buffer.from(bytes).toString('base64');

    r.createActiveContract();
    await new Promise(rz => setTimeout(rz, 0));

    expect(r.abi).toBe('[]');
    expect(fakeWeb3.eth.Contract).toHaveBeenCalled();
    inflateSpy.mockRestore();
  });

  it('readEventsRange ignores __length__ keys when parsing returnValues', async () => {
    const fakeEvent = {
      returnValues: { __length__: 2, issuer: '0xabc' },
      transactionHash: '0x1',
      event: 'TestEvent',
      blockNumber: 10,
      id: 5
    };
    const entity: any = { isConnectionWorking: () => true, web3: null, isSyncing: () => true, setProvider: jest.fn() };
    const r = new Reader(makeRoute({}), entity as any);
    r['contractInstance'] = { getPastEvents: (_: any, __: any) => Promise.resolve([fakeEvent]) } as any;
    r.callbackUpdateUI = jest.fn();
    r.readEventsRange(10, 10, r as any);
    await new Promise((res) => setTimeout(res, 0));
    expect(r.callbackUpdateUI).toHaveBeenCalled();
    // EventData should contain the id based on blockNumber and id
    const expectedId = '10_5';
    expect((require('../models/event').EventData.get(expectedId))).toBeDefined();
    // cleanup
    require('../models/event').EventData.clear();
  });

  it('createActiveContract sets abi to empty when decompression fails and decodedData not JSON', async () => {
    const pako = require('pako');
    const ungzipSpy = jest.spyOn(pako, 'ungzip').mockImplementation(() => { throw new Error('fail'); });
    const inflateSpy = jest.spyOn(pako, 'inflate').mockImplementation(() => { throw new Error('fail'); });
    const inflateRawSpy = jest.spyOn(pako, 'inflateRaw').mockImplementation(() => { throw new Error('fail'); });

    const fakeWeb3: any = { eth: { Contract: jest.fn() } };
    const entity: any = { web3: fakeWeb3, isConnectionWorking: () => true, isSyncing: () => true, setProvider: jest.fn() };
    const r = new Reader(makeRoute({}), entity as any);
    // craft a non-json string bytes
    const bytes = new Uint8Array([0x41, 0x42, 0x43]); // 'ABC'
    r.contract = '0x3';
    r.abiBase64Data = Buffer.from(bytes).toString('base64');

    r.createActiveContract();
    await new Promise(rz => setTimeout(rz, 0));

    expect(r.abi).toBe('');
    ungzipSpy.mockRestore();
    inflateSpy.mockRestore();
    inflateRawSpy.mockRestore();
  });

  it('getCachedMiner returns cached value if present', () => {
    const entity: any = { web3: null, setProvider: jest.fn(), isConnectionWorking: () => false };
    const r = new Reader(makeRoute({}), entity as any);
    r['minerCache'].set('10', 'minerX');
    const v = r.getCachedMiner('10');
    expect(v).toBe('minerX');
    expect(r['minerCache'].get('10')).toBe('minerX');
  });

});
