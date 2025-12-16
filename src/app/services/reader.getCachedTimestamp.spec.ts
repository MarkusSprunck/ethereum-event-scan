import { Reader } from './reader.service';
const Utils = require('./utils.service').UtilsService;
import { makeRoute } from '../../test-helpers';

// helper to wait a microtask
const tick = () => new Promise((res) => setTimeout(res, 0));

describe('Reader.getCachedTimestamp with web3', () => {
  it('loads block via web3 and updates timestampCache and minerCache', async () => {
    // create a plain stub provider so setProvider() won't reset web3
    const providerStub: any = {
      web3: {
        eth: {
          getBlock: jest.fn().mockResolvedValue({ timestamp: 1234567890, miner: '0xabcdef' }),
          getBlockNumber: jest.fn().mockResolvedValue(10)
        }
      },
      isConnectionWorking: jest.fn().mockReturnValue(true),
      isSyncing: jest.fn().mockReturnValue(false),
      setProvider: jest.fn(),
      currentBlock: 10
    };

    const r = new Reader(makeRoute({}), providerStub as any);

    // spy on UtilsService.convertTimestamp and truncate
    const convSpy = jest.spyOn(Utils, 'convertTimestamp').mockReturnValue('DATESTR');
    const truncSpy = jest.spyOn(Utils, 'truncate').mockReturnValue('MINERTR');

    // call getCachedTimestamp; it sets cache asynchronously
    r.getCachedTimestamp('10');

    // wait microtasks
    await tick();

    // check caches updated
    expect(r['timestampCache'].get('10')).toBe('DATESTR');
    expect(r['minerCache'].get('10')).toBe('MINERTR');

    convSpy.mockRestore();
    truncSpy.mockRestore();
  });
});
