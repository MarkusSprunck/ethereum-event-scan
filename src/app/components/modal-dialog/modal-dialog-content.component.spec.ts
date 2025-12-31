import { ModalDialogContentComponent } from './modal-dialog-content.component';
import { ChangeDetectorRef } from '@angular/core';

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
      comp.inputData = { reader: { entity: { web3: null } } } as any;
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
          getTransaction: jest.fn().mockResolvedValue({ blockNumber: 1 }),
          getTransactionReceipt: jest.fn().mockResolvedValue({
            gasUsed: 21000,
            cumulativeGasUsed: 42000,
            contractAddress: null
          })
        }
      };
      const comp = new ModalDialogContentComponent(cdr);
      comp.inputData = {
        reader: { entity: { web3: mockWeb3 }, getCurrentBlockNumber: () => 1000 }
      } as any;
      await comp.renderBlock('123');
      expect(comp.currentBlockNumber).toBe('123');
      expect((cdr as any).detectChanges).toHaveBeenCalled();
    });

    it('should log warning when renderTransaction is called without reader/web3 (line 49)', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const cdr = new CdrStub() as any as ChangeDetectorRef;
      const comp = new ModalDialogContentComponent(cdr);

      // Set up inputData without web3
      comp.inputData = { reader: { entity: { web3: null } } } as any;

      comp.renderTransaction('0x123');

      expect(warnSpy).toHaveBeenCalledWith('No reader/web3 available for renderTransaction');
      expect(comp.currentTrxNumber).toBe('0x123');
      expect(comp.currentBlockNumber).toBe('');
      expect(comp.transactions).toEqual([]);

      warnSpy.mockRestore();
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
        entity: { web3: { eth: { getBlock: jest.fn().mockResolvedValue(fakeBlock) } } },
        getCurrentBlockNumber: () => 999
      } as any;

      comp.inputData = { blockNumber: '5', trxNumber: '', reader: fakeReader } as any;

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

      comp.inputData = { blockNumber: '', trxNumber: '0x1', reader: fakeReader } as any;
      comp.ngOnInit();
      await flushPromises();

      expect(comp.currentTrxNumber).toBe('0x1');
      expect(comp.details).toContain('Index');
      expect(comp.current).toBe(String(fakeTrx.blockNumber));
    });

    it('should log error when getBlock fails (line 92)', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockError = new Error('Block not found');

      const fakeReader = {
        entity: { web3: { eth: { getBlock: jest.fn().mockRejectedValue(mockError) } } },
        getCurrentBlockNumber: () => 999
      } as any;

      comp.inputData = { blockNumber: '12345', trxNumber: '', reader: fakeReader } as any;

      comp.renderBlock('12345');
      await flushPromises();

      expect(errorSpy).toHaveBeenCalledWith('Error fetching block:', mockError);
      expect(comp.currentBlockNumber).toBe('12345');

      errorSpy.mockRestore();
    });
  });
});

