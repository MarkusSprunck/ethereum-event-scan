import { JsonFormatterDirective } from './json-formatter.directive';

function makeEl(value: string) {
  return { nativeElement: { value } } as any;
}

const makeRenderer = () => ({ setProperty: jest.fn() });

const makeNgControl = (initial: string) => ({ control: { value: initial, setValue: jest.fn() } }) as any;

describe('JsonFormatterDirective (unit, direct)', () => {
  it('out and into behave correctly for JSON', () => {
    const dir = new JsonFormatterDirective(makeEl('[{"a":1}]'), makeRenderer() as any, null as any);

    const compact = dir.into('[{"a":1}]');
    expect(compact).toBe(JSON.stringify(JSON.parse('[{"a":1}]')));

    const pretty = dir.out('[{"a":1}]');
    // json-stringify-pretty-compact may produce a single-line output for short JSON;
    // but it will typically include a space after colon. Assert the pretty output differs
    // from compact and contains a ": " sequence.
    expect(pretty).not.toBe(compact);
    expect(pretty).toContain(': ');
  });

  it('into/out return input unchanged for non-JSON', () => {
    const dir = new JsonFormatterDirective(makeEl('not-json'), makeRenderer() as any, null as any);
    expect(dir.into('not-json')).toBe('not-json');
    expect(dir.out('not-json')).toBe('not-json');
  });

  it('onFocus uses ngControl when present', () => {
    const ng = makeNgControl('[{"a":1}]');
    const renderer = makeRenderer();
    const el = makeEl('[{"a":1}]');
    const dir: any = new JsonFormatterDirective(el, renderer as any, ng);

    dir.onFocus(new Event('focus'));
    // debug output
    console.debug('ng.setValue.calls', (ng.control.setValue as any).mock.calls.length);
    console.debug('renderer.setProperty.calls', (renderer.setProperty as any).mock.calls.length);

    // ng.control.setValue should be called with pretty string
    expect(ng.control.setValue).toHaveBeenCalled();
    // renderer.setProperty should update DOM
    expect(renderer.setProperty).toHaveBeenCalled();
  });

  it('onBlur writes compact JSON back', () => {
    const ng = makeNgControl('[{"a":1}]');
    const renderer = makeRenderer();
    const el = makeEl('[{"a":1}]');
    const dir: any = new JsonFormatterDirective(el, renderer as any, ng);

    dir.onBlur(new Event('blur'));
    console.debug('onBlur ng.setValue.calls', (ng.control.setValue as any).mock.calls.length);
    console.debug('onBlur renderer.setProperty.calls', (renderer.setProperty as any).mock.calls.length);
    expect(ng.control.setValue).toHaveBeenCalledWith(JSON.stringify(JSON.parse('[{"a":1}]')) , { emitEvent: true });
    expect(renderer.setProperty).toHaveBeenCalled();
  });

  it('falls back to DOM value when ngControl unavailable', () => {
    const renderer = makeRenderer();
    const el = makeEl('[{"a":1}]');
    const dir: any = new JsonFormatterDirective(el, renderer as any, null as any);

    // onFocus should set DOM via renderer
    dir.onFocus(new Event('focus'));
    expect(renderer.setProperty).toHaveBeenCalled();

    // onBlur should set DOM via renderer
    dir.onBlur(new Event('blur'));
    expect(renderer.setProperty).toHaveBeenCalled();
  });

  it('constructor falls back to manual compact when dispatchEvent throws', () => {
    jest.useFakeTimers();
    const el: any = { nativeElement: { value: '[{"a":1}]', dispatchEvent: jest.fn(() => { throw new Error('boom'); }) } };
    const renderer = makeRenderer();
    const ng = makeNgControl('[{"a":1}]');

    const dir: any = new JsonFormatterDirective(el, renderer as any, ng);
    // advance the constructor's setTimeout
    jest.advanceTimersByTime(0);

    // ng.control.setValue should have been called with compacted JSON
    expect(ng.control.setValue).toHaveBeenCalledWith(JSON.stringify(JSON.parse('[{"a":1}]')) , { emitEvent: true });
    // renderer should update DOM as well
    expect(renderer.setProperty).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('constructor falls back to manual compact when dispatchEvent is not available', () => {
    jest.useFakeTimers();
    const el: any = { nativeElement: { value: '[{"b":2}]' } }; // no dispatchEvent
    const renderer = makeRenderer();
    const ng = makeNgControl('[{"b":2}]');

    const dir: any = new JsonFormatterDirective(el, renderer as any, ng);
    jest.advanceTimersByTime(0);

    expect(ng.control.setValue).toHaveBeenCalledWith(JSON.stringify(JSON.parse('[{"b":2}]')) , { emitEvent: true });
    expect(renderer.setProperty).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('setValue continues to renderer when ngControl.setValue throws', () => {
    const el: any = { nativeElement: { value: '[{"c":3}]' } };
    const renderer = makeRenderer();
    const ng: any = { control: { value: '[{"c":3}]', setValue: jest.fn(() => { throw new Error('fail-set'); }) } };
    const dir: any = new JsonFormatterDirective(el, renderer as any, ng as any);

    // call onBlur which triggers setValue flow
    dir.onBlur(new Event('blur'));
    // renderer should still be called despite ng.control.setValue throwing
    expect(renderer.setProperty).toHaveBeenCalled();
  });
});
