import { SettingsComponent } from './settings.component';
import { FormBuilder } from '@angular/forms';

class ReaderStub {
  abi = '';
  setAbi = jest.fn();
  setStartBlock = jest.fn();
  setEndBlock = jest.fn();
  setContractAddress = jest.fn();
  reset = jest.fn();
  entity = { setProvider: jest.fn() };
  isConnectionWorking = () => false;
}

class CdrStub { detectChanges() {} }
const routerStub = { navigate: jest.fn() } as any;
const routeStub = {} as any;

describe('SettingsComponent (direct instantiation)', () => {
  let comp: SettingsComponent;
  let readerStub: ReaderStub;

  beforeEach(() => {
    readerStub = new ReaderStub();
    comp = new SettingsComponent(new FormBuilder(), readerStub as any, new CdrStub() as any, routerStub, routeStub);
    // initialize form controls
    comp.ngOnInit();
  });

  it('shows panelMessage and updates provider via updateProviderValue', () => {
    expect(comp.panelMessage()).toContain('Last Block');
    const ctrl = comp.form.controls['provider'];
    ctrl.setValue('http://x');
    comp.updateProviderValue();
    expect(comp.provider).toBe('http://x');
  });

  it('updateABIValue parses JSON and calls reader.setAbi', (done) => {
    const json = JSON.stringify([{ type: 'event', name: 'E1', inputs: [] }]);
    comp.form.controls['abi'].setValue(json);
    comp.updateABIValue();
    // wait for async validators and setTimeouts to settle
    setTimeout(() => {
      try {
        expect(readerStub.setAbi).toHaveBeenCalled();
        expect(comp.form.controls['abi'].errors).toBeNull();
        done();
      } catch (e) { done(e); }
    }, 600);
  });

  it('updateContractValue triggers fetchABI branch when provider+contract present and abi empty', () => {
    comp.provider = 'http://x';
    comp.contract = '0x0123456789abcdef0123456789abcdef01234567';
    comp.form.controls['contract'].setValue(comp.contract);
    const Utils = require('../../services/utils.service').UtilsService;

      const fetchSpy = jest.spyOn(Utils, 'fetchABIFromVerifiedContract').mockImplementation((...args: any[]) => (args[1] as Function)('[{"type":"event","name":"E","inputs":[]}]'));

    comp.updateContractValue();
    expect(fetchSpy).toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
