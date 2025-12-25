import {Directive, ElementRef, HostListener, Renderer2, Optional} from '@angular/core';
import {NgControl} from '@angular/forms';
import stringify from 'json-stringify-pretty-compact';

@Directive({
  selector: '[appJsonFormatter]',
  standalone: true
})
export class JsonFormatterDirective {

  private readonly el: HTMLInputElement;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    @Optional() private ngControl: NgControl
  ) {
    this.el = this.elementRef.nativeElement as HTMLInputElement;

    // Trigger onBlur after page reload by dispatching a real blur event so the
    // HostListener('blur', ...) handler is invoked exactly once and receives
    // a genuine Event object (this matches browser behavior).
    setTimeout(() => {
      try {
        const evt = new Event('blur', { bubbles: true, cancelable: false });
        this.el.dispatchEvent(evt);
      } catch (e) {
        // Fallback: if dispatching an event is not possible in the environment,
        // fall back to compacting the value directly.
        const current = this.getValue();
        const compact = this.into(current);
        this.setValue(compact);
      }
    }, 0);
  }

  @HostListener('focus')
  onFocus() {
    const current = this.getValue();
    const pretty = this.out(current);
    this.setValue(pretty);
  }

  @HostListener('blur')
  onBlur() {
    const current = this.getValue();
    const compact = this.into(current);
    this.setValue(compact);
  }

  private getValue(): string {
    try {
      if (this.ngControl && this.ngControl.control) {
        return this.ngControl.control.value || '';
      }
    } catch (e) { /* ignore */ }
    // fallback to DOM value
    try { return (this.el as HTMLInputElement).value || ''; } catch (e) { return ''; }
  }

  private setValue(v: string) {
    try {
      if (this.ngControl && this.ngControl.control) {
        // update FormControl without emitting valueChanges to avoid recursion
        this.ngControl.control.setValue(v, { emitEvent: false });
      }
    } catch (e) { /* ignore */ }
    // also update DOM to keep in sync
    try { this.renderer.setProperty(this.el, 'value', v); } catch (e) { /* ignore */ }
  }

  into(input: any) {
    try {
      return JSON.stringify(JSON.parse(input));
    } catch (e) {
      return input;
    }
  }

  out(data: any) {
    try {
      return stringify(JSON.parse(data), { maxLength: 120, indent: 2 });
    } catch (e) {
      return data;
    }
  }

}
