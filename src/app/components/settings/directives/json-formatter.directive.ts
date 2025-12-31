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
            // dispatchEvent may not be available in some test environments, fall back to manual compact
            if (this.el && typeof this.el.dispatchEvent === 'function') {
                try {
                    const evt = new Event('blur', {bubbles: true, cancelable: false});
                    this.el.dispatchEvent(evt);
                } catch (e) {
                    const current = this.getValue();
                    const compact = this.into(current);
                    this.setValue(compact);
                }
            } else {
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
        // Prefer reactive form control value when available
        if (this.ngControl && this.ngControl.control) {
            return this.ngControl.control.value;
        }
        // fallback to DOM value
       return (this.el as HTMLInputElement).value;
    }

    private setValue(v: string) {
        // update FormControl WITH emitting events so the highlight updates
        if (this.ngControl && this.ngControl.control) {
            try {
                this.ngControl.control.setValue(v, {emitEvent: true});
            } catch (e) {
                // Continue to update DOM even if FormControl setValue fails
            }
        }
        if (this.el && this.renderer) {
            this.renderer.setProperty(this.el, 'value', v);
        }
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
            return stringify(JSON.parse(data), {maxLength: 120, indent: 2});
        } catch (e) {
            return data;
        }
    }

}
