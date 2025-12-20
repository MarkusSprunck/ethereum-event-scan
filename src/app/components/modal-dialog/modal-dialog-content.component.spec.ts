import { ModalDialogContentComponent } from './modal-dialog-content.component';
import { ChangeDetectorRef } from '@angular/core';

class CdrStub { detectChanges = jest.fn(); }

describe('ModalDialogContentComponent (unit)', () => {
  let originalWarn: any;

  beforeAll(() => {
    originalWarn = console.warn;
    console.warn = jest.fn(); // Mock console.warn to suppress warnings during tests
  });

  afterAll(() => {
    console.warn = originalWarn; // Restore original console.warn after tests
  });

  it('should instantiate and handle missing reader gracefully', () => {
    const cdr = new CdrStub() as any as ChangeDetectorRef;
    const comp = new ModalDialogContentComponent(cdr);
    comp.inputData = { reader: { entity: { web3: null } } } as any; // Mock reader with null web3
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
        getTransactionReceipt: jest.fn().mockResolvedValue({ gasUsed: 21000, cumulativeGasUsed: 42000, contractAddress: null })
      }
    };
    const comp = new ModalDialogContentComponent(cdr);
    // Provide reader mock with getCurrentBlockNumber to avoid errors
    comp.inputData = { reader: { entity: { web3: mockWeb3 }, getCurrentBlockNumber: () => 1000 } } as any; // Mock reader with web3
    await comp.renderBlock('123');
    expect(comp.currentBlockNumber).toBe('123');
    expect((cdr as any).detectChanges).toHaveBeenCalled();
  });
});
