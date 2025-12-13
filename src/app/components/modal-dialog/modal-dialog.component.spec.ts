import { ModalDialogComponent } from './modal-dialog.component';

const dialogRefStub = { close: jest.fn() } as any;
const dialogStub = { open: jest.fn() } as any;

const readerStub = {
  setStartBlocktInitial: jest.fn(),
  setEndBlock: jest.fn()
};

describe('ModalDialogComponent (basic)', () => {
  const comp = new ModalDialogComponent(dialogRefStub, { blockNumber: '1', trxNumber: '1', reader: readerStub } as any, dialogStub as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should close dialog', () => {
    comp.onCloseClick();
    expect(dialogRefStub.close).toHaveBeenCalled();
  });

  it('should call onPinStart and call reader & update url (ignore reload)', () => {
    const update = jest.spyOn(require('../../services/utils.service').UtilsService, 'updateURLParameter');
    try {
      comp.onPinStart();
    } catch (e) {
      // jsdom may throw on location.reload(); ignore
    }
    expect(update).toHaveBeenCalled();
    expect(readerStub.setStartBlocktInitial).toHaveBeenCalledWith('1');
  });
});
