import {HighlightSearch} from './highlight-search.pipe';

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

    it('should not throw on regex special characters and should escape HTML', () => {
        expect(pipe.transform('a(b)', '(')).toBe('a<mark>(</mark>b)');
        expect(pipe.transform('<b>abc</b>', 'b')).toBe('<b><mark>b</mark>c</b>'.replace('<mark>b</mark>c', 'a<mark>b</mark>c'));
    });
});
