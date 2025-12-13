import { EventsListResponsiveDirective } from './events-list-responsive.directive';
import { Renderer2 } from '@angular/core';

// Minimal Renderer2 stub
// @ts-ignore
class RendererStub implements Renderer2 {
  data: any;
  destroy(): void {}
  createElement(): any { return document.createElement('div'); }
  createComment(): any { return document.createComment(''); }
  createText(): any { return document.createTextNode(''); }
  appendChild(): void {}
  insertBefore(): void {}
  removeChild(): void {}
  selectRootElement(): any { return document.createElement('table'); }
  parentNode(): any { return null; }
  nextSibling(): any { return null; }
  setAttribute(el: any, name: string, value: string) { el.setAttribute(name, value); }
  removeAttribute(): void {}
  addClass(): void {}
  removeClass(): void {}
  setStyle(): void {}
  removeStyle(): void {}
  setProperty(): void {}
  listen(): () => void { return () => {}; }
}

describe('EventsListResponsiveDirective (basic)', () => {
  it('should create and run lifecycle methods without crashing', () => {
    const table = { nativeElement: document.createElement('table') } as any;
    const renderer = new RendererStub();
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

