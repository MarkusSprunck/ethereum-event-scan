import { ModalDialogContentComponent } from './modal-dialog-content.component';
import { ChangeDetectorRef } from '@angular/core';
import { UtilsService } from '../../services/utils.service';

// simplified ChangeDetectorRef stub using jest.fn for easier assertions if needed
const cdrStub: Partial<ChangeDetectorRef> = { detectChanges: jest.fn() };

// helper to wait for pending promises / microtasks
function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

describe('ModalDialogContentComponent full flows', () => {
  let comp: ModalDialogContentComponent;
  let cdr: ChangeDetectorRef;

  beforeEach(() => {
    cdr = cdrStub as ChangeDetectorRef;
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
    // wait for async microtasks to complete
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
      entity: { web3: { eth: {
        getTransaction: jest.fn().mockResolvedValue(fakeTrx),
        getTransactionReceipt: jest.fn().mockResolvedValue(fakeReceipt)
      } } },
      getCurrentBlockNumber: () => 20
    } as any;

    comp.inputData = { blockNumber: '', trxNumber: '0x1', reader: fakeReader } as any;
    comp.ngOnInit();
    await flushPromises();

    expect(comp.currentTrxNumber).toBe('0x1');
    expect(comp.details).toContain('Index');
    expect(comp.current).toBe(String(fakeTrx.blockNumber));
  });
});
