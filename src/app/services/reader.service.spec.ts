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
});
