import { EventsListResponsiveDirective } from './events-list-responsive.directive';
import { Renderer2 } from '@angular/core';

// Minimal Renderer2 stub as any (avoid implementing full Renderer2 interface)
const RendererStub: any = {
  data: null,
  destroy: () => {},
  createElement: () => document.createElement('div'),
  createComment: () => document.createComment(''),
  appendChild: () => {},
  insertBefore: () => {},
  removeChild: () => {},
  parentNode: () => null,
  nextSibling: () => null,
  setAttribute: (el: any, name: string, value: string) => { el.setAttribute(name, value); },
  removeAttribute: () => {},
  addClass: () => {},
  removeClass: () => {},
  setProperty: () => {}
};

describe('EventsListResponsiveDirective (basic)', () => {
  it('should create and run lifecycle methods without crashing', () => {
    const table = { nativeElement: document.createElement('table') } as any;
    const renderer = RendererStub as Renderer2;
    const dir = new EventsListResponsiveDirective(table, renderer as any);

    // append thead and tbody
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    table.nativeElement.appendChild(thead);
    table.nativeElement.appendChild(tbody);

    dir.ngOnInit();
    dir.ngAfterViewInit();
    dir.ngOnDestroy();

    expect(true).toBeTruthy();
  });
});
