import { SettingsComponent } from './settings.component';
import { FormBuilder } from '@angular/forms';

const Utils = require('../../services/utils.service').UtilsService;

class ReaderStub {
  setAbi = jest.fn();
  setStartBlock = jest.fn();
  setEndBlock = jest.fn();
  setContractAddress = jest.fn();
  entity = { setProvider: jest.fn() };
}
class CdrStub { detectChanges() {} }
const routerStub = { navigate: jest.fn() } as any;
const routeStub = {} as any;

describe('SettingsComponent.updateABIValue', () => {
  let comp: SettingsComponent;
  let reader: ReaderStub;

  beforeEach(() => {
    jest.useFakeTimers();
    reader = new ReaderStub();
    // pass null for router/route so the component uses UtilsService.updateURLWithCompressedAbi fallback
    comp = new SettingsComponent(new FormBuilder(), reader as any, new CdrStub() as any, null as any, null as any);
    // ensure abi control exists
    comp.form.controls['abi'].setValue('');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('calls fetchABIFromVerifiedContract when provider+contract present and control empty', () => {
    comp.provider = 'http://x';
    comp.contract = '0x0123456789abcdef0123456789abcdef01234567';
    // mock fetchABIFromVerifiedContract to invoke callback with ABI string

      const fetchSpy = jest.spyOn(Utils, 'fetchABIFromVerifiedContract').mockImplementation((...args: any[]) => {
      const cb = args[1] as Function;
      cb('[{"type":"event","name":"E","inputs":[]}]');
    });
    const updateCompressed = jest.spyOn(Utils, 'updateURLWithCompressedAbi').mockImplementation(() => {});

    // call with empty control value -> will enter fetch branch
    comp.form.controls['abi'].setValue('');
    comp.updateABIValue();

    // advance timers for setInterval scheduling inside branch
    jest.runOnlyPendingTimers();

    expect(fetchSpy).toHaveBeenCalledWith(comp.contract.trim(), expect.any(Function));
    expect(updateCompressed).toHaveBeenCalled();
    // ABI should be set on component and form control
    expect(comp.abi).toContain('event');
    expect(comp.form.controls['abi'].value).toContain('event');
  });

  it('parses JSON ABI and updates URL and reader when control contains JSON', () => {
    const json = JSON.stringify([
      { type: 'event', name: 'E1', anonymous: true, inputs: [] },
      { type: 'function', name: 'f', inputs: [] },
      { type: 'event', name: 'E2', anonymous: false, inputs: [] }
    ]);

    const updateCompressed = jest.spyOn(Utils, 'updateURLWithCompressedAbi').mockImplementation(() => {});

    comp.form.controls['abi'].setValue(json);

    comp.updateABIValue();

    // run timers for the reload scheduling
    jest.advanceTimersByTime(600);

    // after parse, abi should be set and updateURLWithCompressedAbi called
    expect(updateCompressed).toHaveBeenCalled();
    expect(reader.setAbi).toHaveBeenCalled();
    // form errors cleared
    expect(comp.form.controls['abi'].errors).toBeNull();
  });

  it('sets form error when abi is invalid JSON', () => {
    comp.form.controls['abi'].setValue('invalid json');
    comp.updateABIValue();
    // errors set synchronously in catch
    expect(comp.form.controls['abi'].errors).toEqual({ json: true });
  });
});
