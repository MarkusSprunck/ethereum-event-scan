import { ModalDialogContentComponent } from './modal-dialog-content.component';
import { ChangeDetectorRef } from '@angular/core';

class CdrStub { detectChanges() {} }

describe('ModalDialogContentComponent (unit)', () => {
  it('should instantiate and handle missing reader gracefully', () => {
    const cdr = new CdrStub() as any as ChangeDetectorRef;
    const comp = new ModalDialogContentComponent(cdr);
    comp.inputData = undefined as any;
    comp.ngOnInit();
    expect(comp.currentBlockNumber).toBe('');
  });
});
