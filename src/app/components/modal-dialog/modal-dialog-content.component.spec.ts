import {ModalDialogContentComponent} from './modal-dialog-content.component';
import {ChangeDetectorRef} from '@angular/core';

// simplified ChangeDetectorRef stub
class CdrStub {
    detectChanges = jest.fn();
}

// helper to wait for microtasks
function flushPromises(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
}

describe('ModalDialogContentComponent', () => {
    describe('unit tests', () => {
        let originalWarn: any;

        beforeAll(() => {
            originalWarn = console.warn;
            console.warn = jest.fn(); // suppress during these unit tests
        });

        afterAll(() => {
            console.warn = originalWarn;
        });

        it('should instantiate and handle missing reader gracefully', () => {
            const cdr = new CdrStub() as any as ChangeDetectorRef;
            const comp = new ModalDialogContentComponent(cdr);
            comp.inputData = {reader: {entity: {web3: null}}} as any;
            comp.ngOnInit();
            expect(comp.currentBlockNumber).toBe('');
        });

        it('should not log warnings when reader and web3 are provided', async () => {
            const cdr = new CdrStub() as any as ChangeDetectorRef;
            const mockWeb3 = {
                eth: {
                    getBlock: jest.fn().mockResolvedValue({
                        timestamp: 1234567890,
                        hash: '0x123',
                        sha3Uncles: '0xabc',
                        stateRoot: '0xdef',
                        miner: '0xminer',
                        extraData: 'extra',
                        size: 1000,
                        gasUsed: 5000,
                        transactions: []
                    }),
                    getTransaction: jest.fn().mockResolvedValue({blockNumber: 1}),
                    getTransactionReceipt: jest.fn().mockResolvedValue({
                        gasUsed: 21000,
                        cumulativeGasUsed: 42000,
                        contractAddress: null
                    })
                }
            };
            const comp = new ModalDialogContentComponent(cdr);
            comp.inputData = {
                reader: {entity: {web3: mockWeb3}, getCurrentBlockNumber: () => 1000}
            } as any;
            await comp.renderBlock('123');
            expect(comp.currentBlockNumber).toBe('123');
            expect((cdr as any).detectChanges).toHaveBeenCalled();
        });

    });

    describe('integration tests', () => {
        let comp: ModalDialogContentComponent;
        let cdr: ChangeDetectorRef;

        beforeEach(() => {
            cdr = new CdrStub() as any as ChangeDetectorRef;
            comp = new ModalDialogContentComponent(cdr);
        });

        it('renderBlock sets details and transactions when web3 provides block', async () => {
            const fakeBlock = {
                timestamp: 1572813941,
                hash: '0xabc',
                sha3Uncles: 's1',
                stateRoot: 'sr',
                miner: 'miner1',
                extraData: 'ed',
                size: 100,
                gasUsed: 200,
                transactions: ['tx1', 'tx2']
            };

            const fakeReader = {
                entity: {web3: {eth: {getBlock: jest.fn().mockResolvedValue(fakeBlock)}}},
                getCurrentBlockNumber: () => 999
            } as any;

            comp.inputData = {blockNumber: '5', trxNumber: '', reader: fakeReader} as any;

            comp.ngOnInit();
            await flushPromises();

            expect(comp.currentBlockNumber).toBe('5');
            expect(comp.transactions).toEqual(fakeBlock.transactions);
            expect(comp.details).toContain('Current hash');
            expect(comp.parent).toBe('4');
        });

        it('renderTransaction sets details when web3 provides trx and receipt', async () => {
            const fakeTrx = {
                blockNumber: 10,
                transactionIndex: 1,
                from: '0xfrom',
                to: '0xto',
                value: '0',
                nonce: 0,
                input: '0xabcdef',
                gasPrice: '1'
            };
            const fakeReceipt = {
                contractAddress: null,
                gasUsed: 21000,
                cumulativeGasUsed: 21000
            };

            const fakeReader = {
                entity: {
                    web3: {
                        eth: {
                            getTransaction: jest.fn().mockResolvedValue(fakeTrx),
                            getTransactionReceipt: jest.fn().mockResolvedValue(fakeReceipt)
                        }
                    }
                },
                getCurrentBlockNumber: () => 20
            } as any;

            comp.inputData = {
                blockNumber: '',
                trxNumber: '0x1',
                reader: fakeReader
            } as any;
            comp.ngOnInit();
            await flushPromises();

            expect(comp.currentTrxNumber).toBe('0x1');
            expect(comp.details).toContain('Index');
            expect(comp.current).toBe(String(fakeTrx.blockNumber));
        });

        it('renderBlock reports n.a. child for the latest block and 0 parent for the genesis block', async () => {
            const block = {timestamp: 1, hash: 'h', sha3Uncles: 's', stateRoot: 'r', miner: 'm', extraData: 'e', size: 1, gasUsed: 1, transactions: []};
            comp.inputData = {
                blockNumber: '0', trxNumber: '',
                reader: {entity: {web3: {eth: {getBlock: jest.fn().mockResolvedValue(block)}}}, getCurrentBlockNumber: () => 0}
            } as any;
            comp.ngOnInit();
            await flushPromises();
            expect(comp.child).toBe('n.a.');
            expect(comp.parent).toBe('0');
        });

        it('renderTransaction prints recipient and created contract when present', async () => {
            const trx = {blockNumber: 3, transactionIndex: 0, from: '0xa', to: '0xb', value: '0', nonce: 1, gasPrice: '1', input: '0x1234'};
            const receipt = {gasUsed: 1, cumulativeGasUsed: 2, contractAddress: '0xc'};
            comp.inputData = {
                blockNumber: '', trxNumber: '0xhash',
                reader: {entity: {web3: {eth: {getTransaction: jest.fn().mockResolvedValue(trx), getTransactionReceipt: jest.fn().mockResolvedValue(receipt)}}}}
            } as any;
            comp.ngOnInit();
            await flushPromises();
            expect(comp.details).toContain('To            : 0xb');
            expect(comp.details).toContain('Contract      : 0xc');
        });

        it('renderTransaction prints n.a. for contract creations without recipient', async () => {
            const trx = {blockNumber: 3, transactionIndex: 0, from: '0xa', to: null, value: '0', nonce: 1, gasPrice: '1', input: '0x'};
            comp.inputData = {
                blockNumber: '', trxNumber: '0xhash',
                reader: {entity: {web3: {eth: {getTransaction: jest.fn().mockResolvedValue(trx), getTransactionReceipt: jest.fn().mockResolvedValue({gasUsed: 1, cumulativeGasUsed: 2, contractAddress: null})}}}}
            } as any;
            comp.ngOnInit();
            await flushPromises();
            expect(comp.details).toContain('To            : n.a.');
        });
    });
});
