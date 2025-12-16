import { SettingsComponent } from './settings.component';
import { FormBuilder } from '@angular/forms';

class ReaderStub {}
class CdrStub { detectChanges() {} }
const routerStub = { navigate: jest.fn() } as any;
const routeStub = {} as any;

describe('SettingsComponent async validators', () => {
  let comp: SettingsComponent;

  beforeEach(() => {
    jest.useFakeTimers();
    comp = new SettingsComponent(new FormBuilder(), new ReaderStub() as any, new CdrStub() as any, routerStub, routeStub);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('isProviderConnected resolves null when connected true', async () => {
    comp.connected = true;
    const resP = comp.isProviderConnected({ value: 'http://x' } as any) as Promise<any>;
    jest.runAllTimers();
    const res = await resP;
    expect(res).toBeNull();
  });

  it('isProviderConnected resolves error when not connected', async () => {
    comp.connected = false;
    const resP = comp.isProviderConnected({ value: '' } as any) as Promise<any>;
    jest.runAllTimers();
    const res = await resP;
    expect(res).toEqual({ connected: false });
  });

  it('isContractOk accepts valid hex address and rejects invalid', async () => {
    const good = { value: '0x0123456789abcdef0123456789abcdef01234567' } as any;
    const bad = { value: 'not-an-address' } as any;

    const p1 = comp.isContractOk(good) as Promise<any>;
    const p2 = comp.isContractOk(bad) as Promise<any>;

    jest.runAllTimers();

    expect(await p1).toBeNull();
    expect(await p2).toEqual({ connected: false });
  });

  it('isABIOk accepts valid JSON and rejects invalid', async () => {
    const good = { value: '[{"type":"event","name":"E","inputs":[]}]' } as any;
    const bad = { value: 'not-json' } as any;
    const p1 = comp.isABIOk(good) as Promise<any>;
    const p2 = comp.isABIOk(bad) as Promise<any>;
    jest.runAllTimers();
    expect(await p1).toBeNull();
    expect(await p2).toEqual({ abi_ok: false });
  });

  it('isStartBlockOk accepts numeric strings', async () => {
    const good = { value: '123' } as any;
    const bad = { value: '12a3' } as any;
    const p1 = comp.isStartBlockOk(good) as Promise<any>;
    const p2 = comp.isStartBlockOk(bad) as Promise<any>;
    jest.runAllTimers();
    expect(await p1).toBeNull();
    expect(await p2).toEqual({ isEndBlockValid: false });
  });

  it('isEndBlockOk accepts numeric and LATEST', async () => {
    const good = { value: '234' } as any;
    const latest = { value: 'latest' } as any;
    const bad = { value: 'x234' } as any;
    const p1 = comp.isEndBlockOk(good) as Promise<any>;
    const p2 = comp.isEndBlockOk(latest) as Promise<any>;
    const p3 = comp.isEndBlockOk(bad) as Promise<any>;
    jest.runAllTimers();
    expect(await p1).toBeNull();
    expect(await p2).toBeNull();
    expect(await p3).toEqual({ isEndBlockValid: false });
  });
});
