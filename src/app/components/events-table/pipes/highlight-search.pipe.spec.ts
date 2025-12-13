import { HighlightSearch } from './highlight-search.pipe';

describe('HighlightSearch Pipe', () => {
  const pipe = new HighlightSearch();

  it('should return original value when args is falsy', () => {
    expect(pipe.transform('hello world', '')).toBe('hello world');
    expect(pipe.transform('hello world', null as any)).toBe('hello world');
  });

  it('should wrap matches with <mark>', () => {
    const res = pipe.transform('Hello world hello', 'hello');
    expect(res).toContain('<mark>Hello</mark>');
    expect(res).toContain('<mark>hello</mark>');
  });
});

