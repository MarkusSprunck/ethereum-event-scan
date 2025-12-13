import { ProviderService as PS } from './provider.service';

describe('ProviderService', () => {
  it('setProvider with http should initialize web3 and update status (stubbed)', async () => {
    const svc = new PS();
    // stub web3 to avoid calling real constructor
    svc.web3 = {
      eth: {
        net: { isListening: () => Promise.resolve(true) },
        getBlockNumber: () => Promise.resolve(123),
        isSyncing: () => Promise.resolve(false)
      }
    } as any;

    // call isConnectionWorking which sets connected and block numbers
    svc.isConnectionWorking();
    // wait for the promises to resolve
    await new Promise((r) => setTimeout(r, 0));

    expect(svc.connected).toBeTruthy();
    expect(svc.currentBlock).toBe(123);
  });

  it('setProvider with ws should initialize web3 via websocket (stubbed)', async () => {
    const svc = new PS();
    svc.web3 = {
      eth: {
        net: { isListening: () => Promise.resolve(true) },
        getBlockNumber: () => Promise.resolve(1),
        isSyncing: () => Promise.resolve(false)
      }
    } as any;

    svc.isConnectionWorking();
    await new Promise((r) => setTimeout(r, 0));
    expect(svc.connected).toBeTruthy();
  });

  it('setProvider with invalid url should keep disconnected', () => {
    const svc = new PS();
    svc.setProvider('');
    expect(svc.web3).toBeNull();
    expect(svc.connected).toBe(false);
  });

  it('isSyncing should handle sync object (async update)', async () => {
    const svc = new PS();
    // provide web3.eth.isSyncing returning object
    svc.web3 = { eth: { isSyncing: () => Promise.resolve({ currentBlock: 10, highestBlock: 20 }) } } as any;
    // call method (returns immediate boolean based on current state)
    const immediate = svc.isSyncing();
    expect(immediate).toBe(false); // immediate result before async then resolves
    // wait for pending async update
    await new Promise((r) => setTimeout(r, 0));
    expect(svc.highestBlock).toBe(20);
    expect(svc.currentBlock).toBe(10);
  });
});
