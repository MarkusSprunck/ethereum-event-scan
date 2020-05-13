import {Directive, ElementRef, HostListener, Renderer2} from '@angular/core';
const stringify = require("json-stringify-pretty-compact");

@Directive({
    selector: '[appJsonFormatter]'
})
export class JsonFormatterDirective {

    private el: HTMLInputElement;

    constructor(
        private elementRef: ElementRef, private _renderer: Renderer2
    ) {

        this.el = this.elementRef.nativeElement;
    }

    @HostListener('focus', ['$event.target.value'])
    onFocus(value: any) {
        this.el.value = this.out(value);
        this._renderer.setStyle(this.elementRef.nativeElement, 'background', '#F0F0F0');
    }

    @HostListener('blur', ['$event.target.value'])
    onBlur(value: any) {
        this.el.value = this.into(value);
        this._renderer.setStyle(this.elementRef.nativeElement, 'background', 'white');
    }


    into(input: any) {
        return JSON.stringify(JSON.parse(input));
    }

    out(data: any) {
         return stringify(JSON.parse(data),{maxLength: 120, indent: 2});
    }

}
