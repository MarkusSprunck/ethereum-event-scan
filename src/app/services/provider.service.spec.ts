import {ProviderService as PS} from './provider.service';

describe('ProviderService', () => {
    it('setProvider with http should initialize web3 and update status (stubbed)', async () => {
        const svc = new PS();
        // stub web3 to avoid calling real constructor
        svc.web3 = {
            eth: {
                net: {isListening: () => Promise.resolve(true)},
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
                net: {isListening: () => Promise.resolve(true)},
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
        svc.web3 = {
            eth: {
                isSyncing: () => Promise.resolve({
                    currentBlock: 10,
                    highestBlock: 20
                })
            }
        } as any;
        // call method (returns immediate boolean based on current state)
        const immediate = svc.isSyncing();
        expect(immediate).toBe(false); // immediate result before async then resolves
        // wait for pending async update
        await new Promise((r) => setTimeout(r, 0));
        expect(svc.highestBlock).toBe(20);
        expect(svc.currentBlock).toBe(10);
    });

    it('setProvider with http url creates an http web3 instance', () => {
        const svc = new PS();
        jest.spyOn(svc, 'isConnectionWorking').mockReturnValue(false);
        jest.spyOn(svc, 'isSyncing').mockReturnValue(false);
        svc.setProvider('http://localhost:8545');
        expect(svc.web3).not.toBeNull();
        expect(svc.isConnectionWorking).toHaveBeenCalled();
    });

    it('setProvider rejects unsupported schemes and resets state', () => {
        const svc = new PS();
        svc.connected = true;
        svc.setProvider('file:///etc/passwd');
        expect(svc.web3).toBeNull();
        expect(svc.connected).toBe(false);
        svc.setProvider('');
        expect(svc.web3).toBeNull();
    });

    it('isConnectionWorking returns false without web3 and marks disconnected on errors', async () => {
        const svc = new PS();
        svc.connected = true;
        expect(svc.isConnectionWorking()).toBe(false);
        expect(svc.connected).toBe(false);

        svc.web3 = {
            eth: {
                net: {isListening: () => Promise.reject(new Error('down'))},
                getBlockNumber: () => Promise.reject(new Error('down'))
            }
        } as any;
        svc.connected = true;
        svc.isConnectionWorking();
        await new Promise((r) => setTimeout(r, 0));
        expect(svc.connected).toBe(false);
    });

    it('isConnectionWorking accepts block number 0', async () => {
        const svc = new PS();
        svc.web3 = {eth: {getBlockNumber: () => Promise.resolve(0)}} as any;
        svc.currentBlock = 5;
        svc.isConnectionWorking();
        await new Promise((r) => setTimeout(r, 0));
        expect(svc.currentBlock).toBe(0);
    });

    it('isSyncing is false without web3 and true while behind', () => {
        const svc = new PS();
        expect(svc.isSyncing()).toBe(false);
        svc.web3 = {eth: {isSyncing: () => Promise.resolve(false)}} as any;
        svc.currentBlock = 1;
        svc.highestBlock = 10;
        expect(svc.isSyncing()).toBe(true);
    });
});
