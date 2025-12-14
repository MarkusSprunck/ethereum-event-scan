import { MainComponent } from './main.component';

class ReaderStub {
  runLoadTable = jest.fn();
}

describe('MainComponent (basic)', () => {
  let comp: MainComponent;
  let reader: ReaderStub;

  beforeEach(() => {
    reader = new ReaderStub();
    comp = new MainComponent(reader as any);
  });

  it('should create the component', () => {
    expect(comp).toBeTruthy();
  });

  it('constructor should call runLoadTable on Reader', () => {
    expect(reader.runLoadTable).toHaveBeenCalled();
  });

  it('control property should reference the provided Reader', () => {
    expect((comp as any).control).toBe(reader as any);
  });
});

