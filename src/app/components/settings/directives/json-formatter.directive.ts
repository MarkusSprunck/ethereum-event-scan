import {Directive, ElementRef, HostListener, Renderer2, Optional} from '@angular/core';
import {NgControl} from '@angular/forms';
import stringify from 'json-stringify-pretty-compact';

@Directive({
  selector: '[appJsonFormatter]',
  standalone: true
})
export class JsonFormatterDirective {

  private el: HTMLInputElement;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    @Optional() private ngControl: NgControl
  ) {
    this.el = this.elementRef.nativeElement as HTMLInputElement;
  }

  @HostListener('focus', ['$event'])
  onFocus(event: Event) {
    const current = this.getValue();
    const pretty = this.out(current);
    this.setValue(pretty);
  }

  @HostListener('blur', ['$event'])
  onBlur(event: Event) {
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
