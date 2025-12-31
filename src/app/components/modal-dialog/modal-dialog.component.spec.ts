import {ModalDialogComponent} from './modal-dialog.component';

// stubs and helpers
const dialogRefStub = {close: jest.fn()} as any;
const dialogStub = {open: jest.fn()} as any;

const readerStub = {
    setStartBlockInitial: jest.fn(),
    setEndBlock: jest.fn()
};

describe('ModalDialogComponent', () => {
    const comp = new ModalDialogComponent(
        dialogRefStub,
        {blockNumber: '1', trxNumber: '1', reader: readerStub} as any,
        dialogStub as any
    );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should close dialog', () => {
        comp.onCloseClick();
        expect(dialogRefStub.close).toHaveBeenCalled();
    });
});

